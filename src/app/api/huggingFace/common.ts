import * as dotenv from 'dotenv'
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf'
import { HfInference } from '@huggingface/inference'
dotenv.config()

const { HUGGINGFACEHUB_API_KEY } = process.env || {}

const modelHuggingFaceEmbeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: HUGGINGFACEHUB_API_KEY,
})

const modelHuggingFaceInference = new HfInference(HUGGINGFACEHUB_API_KEY)

const modelHuggingFaceRest = {
    url: `https://api-inference.huggingface.co/models/`,
    params: {
        headers: { Authorization: `Bearer ${HUGGINGFACEHUB_API_KEY}` },
        method: 'POST',
    },
}
const embeddingModel = {
    distilbertBaseNliMeanTokens: `sentence-transformers/distilbert-base-nli-mean-tokens`,
}
export { modelHuggingFaceEmbeddings, modelHuggingFaceInference, modelHuggingFaceRest, embeddingModel }
