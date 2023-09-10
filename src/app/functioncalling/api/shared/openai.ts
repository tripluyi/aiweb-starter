import { ChatOpenAI } from 'langchain/chat_models/openai'
import { HumanMessage } from 'langchain/schema'
import type { ChatOpenAICallOptions } from 'langchain/chat_models/openai'
import type { BaseMessage } from 'langchain/schema'
import * as dotenv from 'dotenv'
dotenv.config()
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const API_KEY = process.env.openAIApiKey || ''
const model35turbo = `gpt-3.5-turbo-0613`
const chat = new ChatOpenAI({
    maxTokens: 500,
    streaming: true,
    openAIApiKey: API_KEY,
    modelName: model35turbo,
})

const openai = new OpenAI({
    apiKey: API_KEY,
})

interface IFunctionCallingMessageProps {
    humanMessage?: string
    mseeages?: BaseMessage[]
    openaiMessages?: ChatCompletionMessageParam[]
    streamHanler: (token: string) => void

    getAllHandler?: (content: BaseMessage) => void
    functions?: ChatOpenAICallOptions['functions']
}

export const getFunctionCallingMessage = async ({
    humanMessage,
    mseeages,
    streamHanler,
    functions,
    getAllHandler,
}: IFunctionCallingMessageProps) => {
    const humanMessageItem = new HumanMessage(humanMessage || '')
    console.log(`humanMessage`, humanMessage, mseeages)
    const callMessageList = mseeages ? mseeages : [humanMessageItem]
    let options: Record<string, any> = {
        callbacks: [
            {
                handleLLMNewToken(token: string) {
                    console.log({ token })
                    streamHanler(token)
                },
            },
        ],
    }
    if (functions) {
        options.functions = functions
    }
    const response = await chat.call(callMessageList, options)
    getAllHandler && getAllHandler(response)
    console.log(`has single msg: ${!!humanMessage}, total response==>`, response)
}

export const getFunctionCallingMessageOpenai = async ({
    humanMessage,
    openaiMessages,
    streamHanler,
    functions,
    getAllHandler,
}: IFunctionCallingMessageProps) => {
    const humanMessageItem = { role: 'user', content: humanMessage } as ChatCompletionMessageParam
    const messagelist: ChatCompletionMessageParam[] = openaiMessages?.length ? openaiMessages : [humanMessageItem]
    const response = await openai.chat.completions.create({
        model: model35turbo,
        messages: messagelist,
        functions: functions,
        // stream: true,
    })
    const responseMessage = response.choices[0].message
    console.log(`responseMessage`, responseMessage)
}
