import embeddingService from "./embeddingService";
import pgService, { PostVector } from "./pgService";
import Post from "../model/postModel";

const getTopK = () => parseInt(process.env.TOP_K || "5");
const getSimilarityThreshold = () => parseFloat(process.env.SIMILARITY_THRESHOLD || "0.7");
const getLLMTimeout = () => parseInt(process.env.LLM_TIMEOUT || "30000");

export interface RAGSource {
    postId: string;
    content: string;
    score: number;
}

export interface RAGResult {
    answer?: string;
    sources: RAGSource[];
    processingTime: number;
    noResults?: boolean;
    posts?: any[];
}

const callOpenAI = async (system: string, user: string): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getLLMTimeout());

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
            signal: controller.signal,
        });

        if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
    } finally {
        clearTimeout(timeout);
    }
};

const sanitize = (input: string): string =>
    input
        .replace(/[<>"'\\]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);

export const indexPost = async (postId: string, content: string): Promise<void> => {
    try {
        const embedding = await embeddingService.embed(content);
        await pgService.upsertPostVector(postId, content, embedding);
    } catch (err) {
        console.error(`Failed to index post ${postId}:`, err);
    }
};

export const removePostIndex = async (postId: string): Promise<void> => {
    try {
        await pgService.deletePostVector(postId);
    } catch (err) {
        console.error(`Failed to remove index for post ${postId}:`, err);
    }
};

export const ragSearch = async (rawQuery: string): Promise<RAGResult> => {
    const start = Date.now();
    const query = sanitize(rawQuery);

    if (!query) {
        return { sources: [], processingTime: 0, noResults: true };
    }

    const queryEmbedding = await embeddingService.embed(query);
    const results = await pgService.searchSimilarPosts(
        queryEmbedding,
        getTopK(),
        getSimilarityThreshold()
    );

    if (results.length === 0) {
        return {
            answer: "I couldn't find relevant posts to answer this question.",
            sources: [],
            processingTime: Date.now() - start,
            noResults: true,
        };
    }

    const postIds = results.map((r) => r.mongoId);
    const posts = await Post.find({ _id: { $in: postIds } })
        .populate("owner", "name email profileImage")
        .lean();

    const postMap = new Map(posts.map((p: any) => [p._id.toString(), p]));

    const sources: RAGSource[] = results
        .filter((r) => postMap.has(r.mongoId))
        .map((r) => ({
            postId: r.mongoId,
            content: r.contentPreview,
            score: r.score ?? 0,
        }));

    // Ask LLM to evaluate relevance
    const context = sources
        .map((s, i) => {
            const post = postMap.get(s.postId) as any;
            const author = post?.owner?.name || "Unknown";
            return `[${i + 1}] Post by ${author}: "${s.content}"`;
        })
        .join("\n\n");

    const system = `You are a relevance evaluator for search results. Your job is to determine if the provided posts are relevant to the user's query.
Respond with ONLY one word:
- "RELEVANT" if at least one post directly relates to or could answer the query
- "NOT_RELEVANT" if none of the posts are related to the query`;

    const user = `Query: "${query}"\n\nPosts:\n${context}\n\nAre these posts relevant?`;

    const evaluation = await callOpenAI(system, user);
    const isRelevant =
        evaluation.trim().toUpperCase().includes("RELEVANT") &&
        !evaluation.trim().toUpperCase().includes("NOT");

    if (isRelevant) {
        const relevantPosts = sources.map((s) => {
            const post = postMap.get(s.postId);
            return {
                ...post,
                relevanceScore: s.score,
            };
        });

        return {
            posts: relevantPosts,
            sources,
            processingTime: Date.now() - start,
        };
    } else {
        return {
            answer: "The search found some posts, but they don't seem relevant to your question. Try rephrasing your query.",
            sources: [],
            processingTime: Date.now() - start,
            noResults: true,
        };
    }
};

export const isAvailable = (): boolean => !!process.env.OPENAI_API_KEY;

export default { indexPost, removePostIndex, ragSearch, isAvailable, sanitize };
