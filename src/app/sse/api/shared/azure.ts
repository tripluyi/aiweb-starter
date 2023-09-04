import { OpenAI } from 'langchain/llms/openai' // azure openai
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BufferMemory } from 'langchain/memory'
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
} from 'langchain/prompts'
import { ConversationChain } from 'langchain/chains'
import * as dotenv from 'dotenv'
dotenv.config()

const {
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName,
    azureOpenAIApiDeployment_GTP35Turbo,
    azureOpenAIApiDeployment_TextDavinci003,
    azureOpenAIApiDeployment_TextEmbeddingAda002,
    azureOpenAIApiVersion,
} = process.env || {}

enum AZURE_MODELS {
    GPT35Turbo = `gpt-35-turbo`,
    TextDavinci003 = `text-davinci-003`,
    TextEmbeddingAda002 = `text-embedding-ada-002`,
}

const params_base = {
    modelName: AZURE_MODELS.GPT35Turbo,
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName: azureOpenAIApiDeployment_GTP35Turbo,
    azureOpenAIApiVersion,
}
const model = new OpenAI({
    temperature: 0.9, // random
    ...params_base,
    maxTokens: 100,
})
// @ts-ignore azure 不支持bestOf
model.bestOf = undefined

const modelChat = new ChatOpenAI({
    temperature: 0.2, // stable
    topP: 0.3, // some stable
    ...params_base,
    maxTokens: 100,
})
// @ts-ignore azure 不支持bestOf
modelChat.bestOf = undefined
