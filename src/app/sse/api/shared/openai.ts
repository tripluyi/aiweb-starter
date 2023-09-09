import { ChatOpenAI } from 'langchain/chat_models/openai'
import { OpenAI } from 'langchain/llms/openai'
import { HumanMessage } from 'langchain/schema'
import * as dotenv from 'dotenv'
dotenv.config()

const API_KEY = process.env.openAIApiKey || ''

const chat = new ChatOpenAI({
    maxTokens: 500,
    streaming: true,
    openAIApiKey: API_KEY,
    modelName: 'gpt-3.5-turbo',
})

const textCom = new OpenAI({
    maxTokens: 500,
    streaming: true,
    openAIApiKey: API_KEY,
    modelName: 'gpt-3.5-turbo',
})

interface IStreamMEssageProps {
    humanMessage: string
    streamHanler: (token: string) => void

    getAllHandler?: (content: string) => void
}

export const getStreamMessage = async ({ humanMessage, streamHanler, getAllHandler }: IStreamMEssageProps) => {
    console.log(`humanMessage==>`, humanMessage)
    const response = await textCom.call(humanMessage, {
        callbacks: [
            {
                handleLLMNewToken(token: string) {
                    // console.log({ token })
                    streamHanler(token)
                },
            },
        ],
    })

    getAllHandler && getAllHandler(response)
}

export const getStreamChatMessage = async ({ humanMessage, streamHanler }: IStreamMEssageProps) => {
    const response = await chat.call([new HumanMessage(humanMessage)], {
        callbacks: [
            {
                handleLLMNewToken(token: string) {
                    console.log({ token })
                    streamHanler(token)
                },
            },
        ],
    })

    console.log(`total response==>`, response)
}

// { token: '' }
// { token: '\n\n' }
// { token: 'Why' }
// { token: ' don' }
// { token: "'t" }
// { token: ' scientists' }
// { token: ' trust' }
// { token: ' atoms' }
// { token: '?\n\n' }
// { token: 'Because' }
// { token: ' they' }
// { token: ' make' }
// { token: ' up' }
// { token: ' everything' }
// { token: '.' }
// { token: '' }
// AIMessage {
//   text: "\n\nWhy don't scientists trust atoms?\n\nBecause they make up everything."
// }
