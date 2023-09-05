import { DiscussServiceClient } from '@google-ai/generativelanguage'
import { GoogleAuth } from 'google-auth-library'
import { ChatGooglePaLM } from 'langchain/chat_models/googlepalm'
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema'

import * as dotenv from 'dotenv'
dotenv.config()

const MODEL_NAME = 'models/chat-bison-001'

const API_KEY = process.env.google_PaLM_API_KEY || ''
const temperature = 0.25

const client = new DiscussServiceClient({
    authClient: new GoogleAuth().fromAPIKey(API_KEY),
})

const system_message = 'You are a local guider in Shanghai.'
const example_human_message = `'Could you suggest some good place?'`
const example_ai_message = `Here are some points of interest in Shanghai that you might want to visit:

The Bund: This iconic waterfront area is a must-see for any visitor to Shanghai. It offers stunning views of the city skyline, and is home to many historical buildings and landmarks.

Nanjing Pedestrian Street: This lively shopping street is a great place to experience the bustling atmosphere of Shanghai. It is lined with numerous shops, restaurants, and street vendors, and is always bustling with activity.`
const model = new ChatGooglePaLM({
    apiKey: API_KEY,
    temperature: temperature,
    modelName: MODEL_NAME,
    // topK: 40, // OPTIONAL
    // topP: 3, // OPTIONAL
    examples: [
        // OPTIONAL
        {
            input: new HumanMessage(example_human_message),
            output: new AIMessage(example_ai_message),
        },
    ],
})

const examples = [
    {
        input: {
            content: example_human_message,
        },
        output: {
            content: example_ai_message,
        },
    },
]
const messages = [
    {
        content:
            'what about redux, do you have experience of redux? and please tell me more about your experience of react.',
    },
]

interface PaLMCallProps {
    msgContent: string
}
export const PaLMCall = async ({ msgContent }: PaLMCallProps) => {
    // res.status(200).json({ name: 'John Doe' })
    const result = await new Promise((resolve, reject) => {
        client
            .generateMessage({
                // required, which model to use to generate the result
                model: MODEL_NAME,
                // optional, 0.0 always uses the highest-probability result
                temperature: 0.25,
                // optional, how many candidate results to generate
                candidateCount: 1,
                // optional, number of most probable tokens to consider for generation
                // topK: 40,
                // optional, for nucleus sampling decoding strategy
                // topP: 0.95,
                prompt: {
                    // optional, sent on every request and prioritized over history
                    context: system_message,
                    // optional, examples to further finetune responses
                    examples: examples,
                    // required, alternating prompt/response messages
                    messages: [
                        {
                            content: msgContent,
                        },
                    ],
                },
            })
            .then((result: any) => {
                console.log(`result===>`, JSON.stringify(result, null, 2))
                resolve(result)
            })
            .catch((err: any) => {
                console.log(`PaLMCall`, { err })
                resolve(err)
            })
    })

    return { result }
}

export const PaLMByLangChain = async ({ msgContent }: PaLMCallProps) => {
    // ask questions
    const questions = [new SystemMessage(system_message), new HumanMessage(msgContent)]

    // You can also use the model as part of a chain
    const res = await model.call(questions)
    console.log({ res })
    return res
}
