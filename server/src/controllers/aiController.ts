import { Response } from "express";
import Post from "../model/postModel";
import { AuthRequest } from "../middleware/authMiddleware";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    entry.count++;
    return true;
};

const sendError = (res: Response, message: string, code = 400) => {
    res.status(code).json({ error: message });
};

interface AIProvider {
    generateResponse(prompt: string): Promise<string>;
}

class GeminiProvider implements AIProvider {
    private apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Gemini API error");
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
}

class OpenAIProvider implements AIProvider {
    private apiKey: string;
    private baseUrl = "https://api.openai.com/v1/chat/completions";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant that helps users search and analyze social media posts. Respond concisely and helpfully." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "OpenAI API error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    }
}

const getAIProvider = (): AIProvider | null => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) return new GeminiProvider(geminiKey);
    if (openaiKey) return new OpenAIProvider(openaiKey);
    return null;
};

const stripLikes = (post: any, userId?: string) => ({
    ...post,
    isLiked: userId
        ? post.likes.some((like: any) => like.toString() === userId)
        : false,
    likes: undefined,
});

const parseJsonFromAI = (text: string): any | null => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
};

const smartSearch = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        if (!checkRateLimit(userId.toString())) {
            return sendError(res, "Rate limit exceeded. Please try again later.", 429);
        }

        const { query } = req.body;

        if (!query || query.trim().length === 0) {
            return sendError(res, "Search query is required");
        }

        const aiProvider = getAIProvider();
        if (!aiProvider) {
            return basicSearch(req, res, query);
        }

        const prompt = `You are helping a user search through social media posts. The user wants to find posts about: "${query}"

Extract the key search terms, topics, or themes from this query. Also identify any sentiment or tone the user might be looking for.

Respond in JSON format only:
{
    "searchTerms": ["term1", "term2"],
    "topics": ["topic1", "topic2"],
    "sentiment": "positive" | "negative" | "neutral" | "any",
    "explanation": "Brief explanation of what you understood"
}`;

        try {
            const aiResponse = await aiProvider.generateResponse(prompt);

            let parsedResponse;
            try {
                parsedResponse = parseJsonFromAI(aiResponse);
                if (!parsedResponse) throw new Error("No JSON found");
            } catch {
                parsedResponse = {
                    searchTerms: query.split(" ").filter((t: string) => t.length > 2),
                    topics: [],
                    sentiment: "any",
                    explanation: "Using direct search terms",
                };
            }

            const searchTerms = [...(parsedResponse.searchTerms || []), ...(parsedResponse.topics || [])];

            const posts = await Post.find({
                $or: searchTerms.map((term: string) => ({
                    content: { $regex: term, $options: "i" },
                })),
            })
                .sort({ likesCount: -1, createdAt: -1 })
                .limit(20)
                .populate("owner", "name email profileImage")
                .lean();

            res.status(200).json({
                posts: posts.map((post: any) => stripLikes(post, userId.toString())),
                aiAnalysis: {
                    searchTerms: parsedResponse.searchTerms,
                    topics: parsedResponse.topics,
                    sentiment: parsedResponse.sentiment,
                    explanation: parsedResponse.explanation,
                },
                totalResults: posts.length,
            });
        } catch (aiError) {
            console.error("AI processing error:", aiError);
            return basicSearch(req, res, query);
        }
    } catch (error) {
        console.error("Smart search error:", error);
        return sendError(res, "Failed to perform smart search", 500);
    }
};

const basicSearch = async (req: AuthRequest, res: Response, query: string) => {
    const userId = req.user?._id?.toString();
    const searchTerms = query.split(" ").filter((t: string) => t.length > 2);

    const posts = await Post.find({
        $or: searchTerms.map((term: string) => ({
            content: { $regex: term, $options: "i" },
        })),
    })
        .sort({ likesCount: -1, createdAt: -1 })
        .limit(20)
        .populate("owner", "name email profileImage")
        .lean();

    res.status(200).json({
        posts: posts.map((post: any) => stripLikes(post, userId)),
        aiAnalysis: null,
        totalResults: posts.length,
        fallback: true,
    });
};

const analyzePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        if (!checkRateLimit(userId.toString())) {
            return sendError(res, "Rate limit exceeded. Please try again later.", 429);
        }

        const { postId } = req.params;

        const post = await Post.findById(postId).lean();
        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        const aiProvider = getAIProvider();
        if (!aiProvider) {
            return sendError(res, "AI service not available", 503);
        }

        const prompt = `Analyze the following social media post and provide insights:

Post content: "${post.content}"

Provide a brief analysis including:
1. Main topic/theme
2. Sentiment (positive, negative, neutral)
3. Suggested tags/keywords
4. Brief summary

Respond in JSON format only:
{
    "topic": "main topic",
    "sentiment": "positive" | "negative" | "neutral",
    "tags": ["tag1", "tag2", "tag3"],
    "summary": "brief summary"
}`;

        try {
            const aiResponse = await aiProvider.generateResponse(prompt);

            let parsedResponse;
            try {
                parsedResponse = parseJsonFromAI(aiResponse);
                if (!parsedResponse) throw new Error("No JSON found");
            } catch {
                parsedResponse = {
                    topic: "Unable to determine",
                    sentiment: "neutral",
                    tags: [],
                    summary: post.content.substring(0, 100),
                };
            }

            res.status(200).json({ postId, analysis: parsedResponse });
        } catch (aiError) {
            console.error("AI analysis error:", aiError);
            return sendError(res, "AI analysis failed", 503);
        }
    } catch (error) {
        console.error("Analyze post error:", error);
        return sendError(res, "Failed to analyze post", 500);
    }
};

const generateSuggestions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        if (!checkRateLimit(userId.toString())) {
            return sendError(res, "Rate limit exceeded. Please try again later.", 429);
        }

        const { topic } = req.body;

        const aiProvider = getAIProvider();
        if (!aiProvider) {
            return sendError(res, "AI service not available", 503);
        }

        const prompt = `Generate 3 creative post ideas for a social media user interested in: "${topic || "general topics"}"

Each post should be engaging and suitable for a social platform.

Respond in JSON format only:
{
    "suggestions": [
        { "title": "short title", "content": "full post content (50-150 words)" },
        { "title": "short title", "content": "full post content (50-150 words)" },
        { "title": "short title", "content": "full post content (50-150 words)" }
    ]
}`;

        try {
            const aiResponse = await aiProvider.generateResponse(prompt);

            let parsedResponse;
            try {
                parsedResponse = parseJsonFromAI(aiResponse);
                if (!parsedResponse) throw new Error("No JSON found");
            } catch {
                parsedResponse = {
                    suggestions: [{ title: "Unable to generate", content: "Please try again later." }],
                };
            }

            res.status(200).json(parsedResponse);
        } catch (aiError) {
            console.error("AI suggestions error:", aiError);
            return sendError(res, "Failed to generate suggestions", 503);
        }
    } catch (error) {
        console.error("Generate suggestions error:", error);
        return sendError(res, "Failed to generate suggestions", 500);
    }
};

export default {
    smartSearch,
    analyzePost,
    generateSuggestions,
};
