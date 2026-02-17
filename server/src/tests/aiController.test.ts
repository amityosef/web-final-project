import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('aiController', () => {
    beforeEach(() => {
        process.env.OPENAI_API_KEY = 'test';
    });

    const makeRes = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json } as any;
    };

    it('ragSearch returns 401 when unauthorized', async () => {
        await jest.isolateModulesAsync(async () => {
            const controller = await import('../controllers/aiController');
            const req: any = { body: { query: 'x' }, user: undefined };
            const res = makeRes();
            await controller.default.ragSearch(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.status().json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    it('ragSearch enforces rate limit', async () => {
        await jest.isolateModulesAsync(async () => {
            const ragMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>;
            ragMock.mockResolvedValue({ answer: 'a', sources: [], posts: [], processingTime: 1, noResults: false });

            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { ragSearch: ragMock, isAvailable: () => true } }));

            const controller = await import('../controllers/aiController');
            const req = { body: { query: 'q' }, user: { _id: { toString: () => 'u1' } } } as any;

            for (let i = 0; i < 15; i++) {
                const res = makeRes();
                await controller.default.ragSearch(req, res);
                expect(res.status).toHaveBeenCalledWith(200);
            }

            const resLast = makeRes();
            await controller.default.ragSearch(req, resLast);
            expect(resLast.status).toHaveBeenCalledWith(429);
        });
    });

    it('ragSearch validates query and availability', async () => {
        await jest.isolateModulesAsync(async () => {
            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { isAvailable: () => false } }));
            const controller = await import('../controllers/aiController');
            const resEmpty = makeRes();
            const reqEmpty = { body: { query: '   ' }, user: { _id: { toString: () => 'u2' } } } as any;
            await controller.default.ragSearch(reqEmpty, resEmpty);
            expect(resEmpty.status).toHaveBeenCalledWith(400);

            const resUnavailable = makeRes();
            const req = { body: { query: 'x' }, user: { _id: { toString: () => 'u3' } } } as any;
            await controller.default.ragSearch(req, resUnavailable);
            expect(resUnavailable.status).toHaveBeenCalledWith(503);
        });
    });

    it('ragSearch handles success', async () => {
        await jest.isolateModulesAsync(async () => {
            const good = { answer: 'ok', sources: [], posts: [], processingTime: 2 };
            const ragMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>;
            ragMock.mockResolvedValue(good);
            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { ragSearch: ragMock, isAvailable: () => true } }));

            const controller = await import('../controllers/aiController');
            const res = makeRes();
            const req = { body: { query: 'ok' }, user: { _id: { toString: () => 'u4' } } } as any;
            await controller.default.ragSearch(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    it('ragSearch handles service errors', async () => {
        await jest.isolateModulesAsync(async () => {
            const ragFail = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>;
            ragFail.mockRejectedValue(new Error('fail'));
            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { ragSearch: ragFail, isAvailable: () => true } }));
            const controller2 = await import('../controllers/aiController');
            const res2 = makeRes();
            const req2 = { body: { query: 'ok' }, user: { _id: { toString: () => 'u5' } } } as any;
            await controller2.default.ragSearch(req2, res2);
            expect(res2.status).toHaveBeenCalledWith(500);
        });
    });

    it('smartSearch falls back to DB when AI not available', async () => {
        await jest.isolateModulesAsync(async () => {
            const fakePost = { _id: 'p1' };
            // chainable find().sort().limit().populate().lean() that returns [fakePost]
            jest.doMock('../model/postModel', () => ({
                __esModule: true, default: {
                    find: () => ({
                        sort: () => ({
                            limit: () => ({
                                populate: () => ({
                                    lean: async () => [fakePost],
                                }),
                            }),
                        }),
                    }),
                }
            }));
            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { isAvailable: () => false } }));

            const controller = await import('../controllers/aiController');
            const res = makeRes();
            const req = { body: { query: 'search terms' }, user: { _id: { toString: () => 'u6' } } } as any;
            await controller.default.smartSearch(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ posts: [fakePost], fallback: true }));
        });
    });

    it('smartSearch handles DB errors', async () => {
        await jest.isolateModulesAsync(async () => {
            // simulate DB failure when chaining find().sort() by throwing in sort()
            jest.doMock('../model/postModel', () => ({
                __esModule: true, default: {
                    find: () => ({
                        sort: () => { throw new Error('db'); },
                    }),
                }
            }));
            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { isAvailable: () => false } }));
            const controller2 = await import('../controllers/aiController');
            const res2 = makeRes();
            const req2 = { body: { query: 'x' }, user: { _id: { toString: () => 'u7' } } } as any;
            await controller2.default.smartSearch(req2, res2);
            expect(res2.status).toHaveBeenCalledWith(500);
        });
    });

    it('reindexAllPosts unauthorized and handles indexing counts and errors', async () => {
        await jest.isolateModulesAsync(async () => {
            const controller = await import('../controllers/aiController');
            const resAuth = makeRes();
            const reqAuth = { user: undefined } as any;
            await controller.default.reindexAllPosts(reqAuth, resAuth);
            expect(resAuth.status).toHaveBeenCalledWith(401);
        });

        await jest.isolateModulesAsync(async () => {
            const posts = [{ _id: 'a', content: 'c1' }, { _id: 'b', content: 'c2' }] as any;
            jest.doMock('../model/postModel', () => ({
                __esModule: true, default: {
                    find: () => ({
                        select: () => ({
                            lean: async () => posts,
                        }),
                    }),
                }
            }));

            const indexMock = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<void>>;
            indexMock.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('bad'));
            jest.doMock('../services/aiService', () => ({ __esModule: true, default: { indexPost: indexMock } }));

            const controller2 = await import('../controllers/aiController');
            const res = makeRes();
            const req = { user: { _id: { toString: () => 'u8' } } } as any;
            await controller2.default.reindexAllPosts(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Reindexed') }));
        });

        await jest.isolateModulesAsync(async () => {
            // Simulate select().lean() throwing when reading posts
            jest.doMock('../model/postModel', () => ({
                __esModule: true, default: {
                    find: () => ({
                        select: () => ({
                            lean: async () => { throw new Error('failread'); },
                        }),
                    }),
                }
            }));
            const controller3 = await import('../controllers/aiController');
            const res3 = makeRes();
            const req3 = { user: { _id: { toString: () => 'u9' } } } as any;
            await controller3.default.reindexAllPosts(req3, res3);
            expect(res3.status).toHaveBeenCalledWith(500);
        });
    });
});

export { };
