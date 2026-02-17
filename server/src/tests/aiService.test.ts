import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('aiService', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.VECTOR_DIMENSIONS = '3';
        process.env.TOP_K = '2';
        process.env.SIMILARITY_THRESHOLD = '0.1';
    });

    it('sanitize helper trims and strips dangerous chars', async () => {
        const ai = await import('../services/aiService');
        const input = '  <script> hello   "world"\\   ';
        const out = ai.default.sanitize(input);
        expect(out).toBe('script hello world');
        expect(out.length).toBeLessThanOrEqual(2000);
    });

    it('indexPost calls embedding and upsert on success', async () => {
        await jest.isolateModulesAsync(async () => {
            const embedMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<number[]>>;
            embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
            const upsertMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<void>>;
            upsertMock.mockResolvedValue(undefined);

            jest.doMock('../services/embeddingService', () => ({
                __esModule: true,
                default: { embed: embedMock, preloadModel: jest.fn() },
            }));

            jest.doMock('../services/pgService', () => ({
                __esModule: true,
                default: { upsertPostVector: upsertMock, deletePostVector: jest.fn(), searchSimilarPosts: jest.fn() },
            }));

            const ai = await import('../services/aiService');
            await ai.indexPost('p1', 'hello world');

            expect(embedMock).toHaveBeenCalledWith('hello world');
            expect(upsertMock).toHaveBeenCalledWith('p1', 'hello world', [0.1, 0.2, 0.3]);
        });
    });

    it('indexPost logs error when embedding fails', async () => {
        await jest.isolateModulesAsync(async () => {
            const embedMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<number[]>>;
            embedMock.mockRejectedValue(new Error('embed fail'));
            const upsertMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<void>>;
            jest.doMock('../services/embeddingService', () => ({
                __esModule: true,
                default: { embed: embedMock, preloadModel: jest.fn() },
            }));
            jest.doMock('../services/pgService', () => ({
                __esModule: true,
                default: { upsertPostVector: upsertMock, deletePostVector: jest.fn(), searchSimilarPosts: jest.fn() },
            }));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const ai = await import('../services/aiService');
            await ai.indexPost('p2', 'bad');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    it('removePostIndex logs error when delete fails', async () => {
        await jest.isolateModulesAsync(async () => {
            const deleteMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<void>>;
            deleteMock.mockRejectedValue(new Error('db fail'));
            jest.doMock('../services/pgService', () => ({
                __esModule: true,
                default: { upsertPostVector: jest.fn(), deletePostVector: deleteMock, searchSimilarPosts: jest.fn() },
            }));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const ai = await import('../services/aiService');
            await ai.removePostIndex('p3');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    it('ragSearch returns noResults for empty query', async () => {
        const ai = await import('../services/aiService');
        const res = await ai.ragSearch('   ');
        expect(res.noResults).toBeTruthy();
        expect(res.sources).toEqual([]);
    });

    it('ragSearch returns message when search returns empty', async () => {
        await jest.isolateModulesAsync(async () => {
            const embedMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<number[]>>;
            embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
            const searchMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any[]>>;
            searchMock.mockResolvedValue([]);
            jest.doMock('../services/embeddingService', () => ({
                __esModule: true,
                default: { embed: embedMock, preloadModel: jest.fn() },
            }));
            jest.doMock('../services/pgService', () => ({
                __esModule: true,
                default: { upsertPostVector: jest.fn(), deletePostVector: jest.fn(), searchSimilarPosts: searchMock },
            }));

            const ai = await import('../services/aiService');
            const out = await ai.ragSearch('something');
            expect(out.noResults).toBeTruthy();
            expect(out.answer).toMatch(/couldn't find relevant posts/);
        });
    });

    it('ragSearch returns posts when LLM says RELEVANT', async () => {
        await jest.isolateModulesAsync(async () => {
            const embedMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<number[]>>;
            embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
            const searchMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any[]>>;
            searchMock.mockResolvedValue([
                { mongoId: 'm1', contentPreview: 'preview', score: 0.9 },
            ]);

            const fakePost = { _id: 'm1', owner: { name: 'Alice' }, title: 'T1' };
            // Mock Post.find with typed mocks
            const populateMock = jest.fn() as jest.MockedFunction<(...args: any[]) => any>;
            const leanMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any[]>>;
            leanMock.mockResolvedValue([fakePost]);
            populateMock.mockReturnThis();
            const findMock = jest.fn() as jest.MockedFunction<(...args: any[]) => any>;
            findMock.mockReturnValue({ populate: populateMock, lean: leanMock });
            jest.doMock('../model/postModel', () => ({
                __esModule: true,
                default: {
                    find: findMock,
                },
            }));

            jest.doMock('../services/embeddingService', () => ({
                __esModule: true,
                default: { embed: embedMock, preloadModel: jest.fn() },
            }));

            jest.doMock('../services/pgService', () => ({
                __esModule: true,
                default: { upsertPostVector: jest.fn(), deletePostVector: jest.fn(), searchSimilarPosts: searchMock },
            }));

            // Mock fetch for callOpenAI
            const fetchMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>;
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'RELEVANT' } }] }) });
            (global as any).fetch = fetchMock;

            const ai = await import('../services/aiService');
            const out = await ai.ragSearch('query');
            expect(out.posts).toBeDefined();
            expect(out.posts?.[0].relevanceScore).toBe(0.9);
        });
    });

    it('ragSearch returns noResults when LLM says NOT_RELEVANT', async () => {
        await jest.isolateModulesAsync(async () => {
            const embedMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<number[]>>;
            embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
            const searchMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any[]>>;
            searchMock.mockResolvedValue([
                { mongoId: 'm2', contentPreview: 'preview2', score: 0.5 },
            ]);

            const fakePost = { _id: 'm2', owner: { name: 'Bob' }, title: 'T2' };
            const populateMock2 = jest.fn() as jest.MockedFunction<(...args: any[]) => any>;
            const leanMock2 = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any[]>>;
            leanMock2.mockResolvedValue([fakePost]);
            populateMock2.mockReturnThis();
            const findMock2 = jest.fn() as jest.MockedFunction<(...args: any[]) => any>;
            findMock2.mockReturnValue({ populate: populateMock2, lean: leanMock2 });
            jest.doMock('../model/postModel', () => ({
                __esModule: true,
                default: {
                    find: findMock2,
                },
            }));

            jest.doMock('../services/embeddingService', () => ({
                __esModule: true,
                default: { embed: embedMock, preloadModel: jest.fn() },
            }));

            jest.doMock('../services/pgService', () => ({
                __esModule: true,
                default: { upsertPostVector: jest.fn(), deletePostVector: jest.fn(), searchSimilarPosts: searchMock },
            }));

            const fetchMock2 = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>;
            fetchMock2.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'NOT_RELEVANT' } }] }) });
            (global as any).fetch = fetchMock2;

            const ai = await import('../services/aiService');
            const out = await ai.ragSearch('query2');
            expect(out.noResults).toBeTruthy();
            expect(out.answer).toMatch(/don't seem relevant/);
        });
    });

    it('isAvailable reflects OPENAI_API_KEY presence', async () => {
        const ai = await import('../services/aiService');
        expect(ai.isAvailable()).toBe(true);
        delete process.env.OPENAI_API_KEY;
        expect(ai.isAvailable()).toBe(false);
    });
});

export { };
