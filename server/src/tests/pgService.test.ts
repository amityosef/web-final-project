import { expect, jest, describe, it } from '@jest/globals';

describe('pgService', () => {
    it('initPostVectorsTable, upsert, delete, and search work with pool mocks', async () => {
        await jest.isolateModulesAsync(async () => {
            type QueryCall = { q: unknown; p?: unknown[] };
            const clientQueries: QueryCall[] = [];

            const client = {
                query: jest.fn(async (q: unknown, p?: unknown[]) => {
                    clientQueries.push({ q, p });
                    return { rows: [] };
                }),
                release: jest.fn(),
            };

            const pool = {
                query: jest.fn() as jest.MockedFunction<(text: string, params?: unknown[]) => Promise<unknown>>,
                connect: jest.fn(async () => client),
                on: jest.fn(),
            };

            const Pool = jest.fn(() => pool);

            jest.doMock('pg', () => ({ Pool }));

            const pgService = (await import('../services/pgService')) as typeof import('../services/pgService');

            await pgService.initPostVectorsTable();
            expect(client.query).toHaveBeenCalled();
            expect(client.release).toHaveBeenCalled();

            pool.query.mockResolvedValueOnce({});
            await pgService.upsertPostVector('m1', 'preview text', [1, 2, 3]);
            expect(pool.query).toHaveBeenCalled();
            const upsertCall = (pool.query as jest.Mock).mock.calls[0][0] as string;
            expect(upsertCall).toEqual(expect.stringContaining('INSERT INTO post_vectors'));

            pool.query.mockResolvedValueOnce({});
            await pgService.deletePostVector('m1');
            const deleteCall = (pool.query as jest.Mock).mock.calls.slice(-1)[0][0] as string;
            expect(deleteCall).toEqual(expect.stringContaining('DELETE FROM post_vectors'));

            pool.query.mockResolvedValueOnce({ rows: [{ mongo_id: 'm1', content_preview: 'p', score: 0.9 }] });
            const res = await pgService.searchSimilarPosts([0.1, 0.2, 0.3], 1, 0.5);
            expect(res).toHaveLength(1);
            expect(res[0].mongoId).toBe('m1');
            expect(res[0].score).toBeCloseTo(0.9);
        });
    });
});
