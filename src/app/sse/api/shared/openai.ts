import { ChatOpenAI } from 'langchain/chat_models/openai'
import { HumanMessage } from 'langchain/schema'
import * as dotenv from 'dotenv'
dotenv.config()

const API_KEY = process.env.openAIApiKey || ''

const chat = new ChatOpenAI({
    //   maxTokens: 25,
    streaming: true,
    openAIApiKey: API_KEY,
    modelName: 'gpt-3.5-turbo',
})

export const getStreamMessage = async () => {
    const response = await chat.call([new HumanMessage('Tell me a joke.')], {
        callbacks: [
            {
                handleLLMNewToken(token: string) {
                    console.log({ token })
                },
            },
        ],
    })

    console.log(response)
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
