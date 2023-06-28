import * as dotenv from 'dotenv'
dotenv.config()

const env = process.env.PINECONE_ENV
const projectName = process.env.PINECONE_PRJ_NAME
export const jsonContentType = {
    'content-type': 'application/json',
}
export const commonHeaders = {
    accept: 'application/json',
    'Api-Key': process.env.PINECONE_API_KEY,
    ...jsonContentType,
}

export const IndexBaseUrl = `https://controller.${env}.pinecone.io/databases`
export const VectorBaseUrl = `https://{{index}}-${projectName}.svc.${env}.pinecone.io`
export const VectorUpsertUrl = `${VectorBaseUrl}/vectors/upsert`
export const VectorDeltUrl = `${VectorBaseUrl}/vectors/delete`
export const VectorQueryUrl = `${VectorBaseUrl}/query`
export const defaultDimension = 1536
export const openaiPineconeIndex = 'openai'
