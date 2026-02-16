import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import aiService from "../services/aiService";
import Post from "../model/postModel";

const rateLimits = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = { window: 60_000, max: 15 };

const withinRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const entry = rateLimits.get(userId);
    if (!entry || now > entry.reset) {
        rateLimits.set(userId, { count: 1, reset: now + RATE_LIMIT.window });
        return true;
    }
    if (entry.count >= RATE_LIMIT.max) return false;
    entry.count++;
    return true;
};

const send = (res: Response, status: number, data: unknown) => res.status(status).json(data);
const error = (res: Response, msg: string, code = 400) => send(res, code, { error: msg });

const ragSearch = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id?.toString();
    if (!userId) return error(res, "Unauthorized", 401);
    if (!withinRateLimit(userId)) return error(res, "Rate limit exceeded", 429);

    const { query } = req.body;
    if (!query?.trim()) return error(res, "Query is required");
    if (!aiService.isAvailable()) return error(res, "AI service unavailable", 503);

    try {
        const result = await aiService.ragSearch(query);
        send(res, 200, {
            answer: result.answer,
            sources: result.sources,
            posts: result.posts,
            processingTime: result.processingTime,
            noResults: result.noResults ?? false,
        });
    } catch (err) {
        console.error("RAG search failed:", err);
        error(res, "Search failed", 500);
    }
};

const smartSearch = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id?.toString();
    if (!userId) return error(res, "Unauthorized", 401);
    if (!withinRateLimit(userId)) return error(res, "Rate limit exceeded", 429);

    const { query } = req.body;
    if (!query?.trim()) return error(res, "Query is required");

    try {
        if (aiService.isAvailable()) {
            const result = await aiService.ragSearch(query);
            return send(res, 200, {
                answer: result.answer,
                sources: result.sources,
                posts: result.posts,
                processingTime: result.processingTime,
                noResults: result.noResults ?? false,
            });
        }

        const terms = query.split(/\s+/).filter((t: string) => t.length > 2);
        const posts = await Post.find({
            $or: terms.map((term: string) => ({ content: { $regex: term, $options: "i" } })),
        })
            .sort({ likesCount: -1, createdAt: -1 })
            .limit(20)
            .populate("owner", "name email profileImage")
            .lean();

        send(res, 200, { posts, fallback: true });
    } catch (e) {
        console.error("Search failed:", e);
        error(res, "Search failed", 500);
    }
};

const reindexAllPosts = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id?.toString();
    if (!userId) return error(res, "Unauthorized", 401);

    try {
        const posts = await Post.find({}).select("_id content").lean();
        let indexed = 0;

        for (const post of posts) {
            try {
                await aiService.indexPost(post._id.toString(), post.content);
                indexed++;
            } catch (err) {
                console.error(`Reindex failed for post ${post._id}:`, err);
            }
        }

        send(res, 200, { message: `Reindexed ${indexed}/${posts.length} posts` });
    } catch (e) {
        console.error("Reindex failed:", e);
        error(res, "Reindex failed", 500);
    }
};

export default { ragSearch, smartSearch, reindexAllPosts };
