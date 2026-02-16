type Pipeline = (
    texts: string[],
    options?: { pooling: string; normalize: boolean }
) => Promise<{ tolist: () => number[][] }>;

let pipeline: Pipeline | null = null;
let loadingPromise: Promise<void> | null = null;
let isLoaded = false;

const MODEL_NAME = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
const VECTOR_DIMENSIONS = parseInt(process.env.VECTOR_DIMENSIONS || "384");

const loadModel = async (): Promise<void> => {
    if (isLoaded) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            console.log(`Loading embedding model: ${MODEL_NAME}...`);
            const transformers = await Function('return import("@xenova/transformers")')();
            const pipelineFn = transformers.pipeline as unknown as (
                task: string,
                model: string
            ) => Promise<Pipeline>;
            pipeline = await pipelineFn("feature-extraction", MODEL_NAME);
            isLoaded = true;
            console.log(`Embedding model loaded successfully (${VECTOR_DIMENSIONS} dimensions)`);
        } catch (err) {
            console.error("Failed to load embedding model:", err);
            loadingPromise = null;
            throw err;
        }
    })();

    return loadingPromise;
};

export const embed = async (text: string): Promise<number[]> => {
    if (!isLoaded) await loadModel();
    if (!pipeline) throw new Error("Embedding model not loaded");

    const sanitized = text.replace(/\s+/g, " ").trim().slice(0, 512);
    if (!sanitized) throw new Error("Empty text cannot be embedded");

    const output = await pipeline([sanitized], { pooling: "mean", normalize: true });
    const embedding = output.tolist()[0];

    if (embedding.length !== VECTOR_DIMENSIONS) {
        throw new Error(`Expected ${VECTOR_DIMENSIONS} dimensions, got ${embedding.length}`);
    }

    return embedding;
};

export const preloadModel = loadModel;

export default { embed, preloadModel };
