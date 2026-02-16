import { Pool, PoolClient } from "pg";

let pool: Pool | null = null;

const getPool = (): Pool => {
    if (!pool) {
        const config = {
            host: process.env.PG_HOST || "localhost",
            port: parseInt(process.env.PG_PORT || "5432"),
            user: process.env.PG_USER || "postgres",
            password: process.env.PG_PASSWORD || "",
            database: process.env.PG_DATABASE || "postgres",
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        };

        pool = new Pool(config);

        pool.on("error", (err) => {
            console.error("PostgreSQL pool error:", err.message);
        });
    }
    return pool;
};

export const initPostVectorsTable = async (): Promise<void> => {
    const client = await getPool().connect();
    try {
        await client.query("CREATE EXTENSION IF NOT EXISTS vector");
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_vectors (
                id SERIAL PRIMARY KEY,
                mongo_id VARCHAR(24) UNIQUE NOT NULL,
                content_preview VARCHAR(500) NOT NULL,
                embedding vector(384) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_post_vectors_embedding 
            ON post_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
        `);
        console.log("PostgreSQL: post_vectors table initialized");
    } catch (err) {
        console.error("PostgreSQL init error:", err);
        throw err;
    } finally {
        client.release();
    }
};

export interface PostVector {
    mongoId: string;
    contentPreview: string;
    embedding: number[];
    score?: number;
}

export const upsertPostVector = async (
    mongoId: string,
    contentPreview: string,
    embedding: number[]
): Promise<void> => {
    const embeddingStr = `[${embedding.join(",")}]`;
    await getPool().query(
        `INSERT INTO post_vectors (mongo_id, content_preview, embedding, updated_at)
         VALUES ($1, $2, $3::vector, NOW())
         ON CONFLICT (mongo_id) DO UPDATE SET
            content_preview = EXCLUDED.content_preview,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()`,
        [mongoId, contentPreview.slice(0, 500), embeddingStr]
    );
};

export const deletePostVector = async (mongoId: string): Promise<void> => {
    await getPool().query("DELETE FROM post_vectors WHERE mongo_id = $1", [mongoId]);
};

export const searchSimilarPosts = async (
    queryEmbedding: number[],
    topK: number,
    threshold: number
): Promise<PostVector[]> => {
    const embeddingStr = `[${queryEmbedding.join(",")}]`;
    const result = await getPool().query<{
        mongo_id: string;
        content_preview: string;
        score: number;
    }>(
        `SELECT 
            mongo_id,
            content_preview,
            1 - (embedding <=> $1::vector) AS score
         FROM post_vectors
         WHERE 1 - (embedding <=> $1::vector) >= $3
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [embeddingStr, topK, threshold]
    );

    return result.rows.map((row) => ({
        mongoId: row.mongo_id,
        contentPreview: row.content_preview,
        embedding: [],
        score: row.score,
    }));
};

export const getClient = (): Promise<PoolClient> => getPool().connect();
export const query = (text: string, params?: any[]) => getPool().query(text, params);

export default {
    initPostVectorsTable,
    upsertPostVector,
    deletePostVector,
    searchSimilarPosts,
    getClient,
    query,
};
