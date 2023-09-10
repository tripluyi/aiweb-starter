import { NextRequest, NextResponse } from 'next/server'
import { getFunctionCallingMessage, getFunctionCallingMessageOpenai } from '../shared/openai'
import type { BaseMessage } from 'langchain/schema'
import { HumanMessage, AIMessage, AIMessageChunk, FunctionMessage, SystemMessage } from 'langchain/schema'
export async function POST(request: NextRequest) {
    let rbody = {}
    try {
        const rtext = await request.text()
        rbody = (rtext && JSON.parse(rtext)) || {}
    } catch (e) {}

    // 将 SSE 数据编码为 Uint8Array
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const sseData = `:ok\n\nevent: message\ndata: Initial message\n\n`
    const sseUint8Array = encoder.encode(sseData)

    // 创建 TransformStream
    const transformStream = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk)
        },
    })

    // 创建 SSE 响应
    let response = new NextResponse(transformStream.readable)

    // 设置响应头，指定使用 SSE
    response.headers.set('Content-Type', 'text/event-stream; charset=utf-8')
    response.headers.set('Cache-Control', 'no-cache')
    response.headers.set('Connection', 'keep-alive')
    response.headers.set('Transfer-Encoding', 'chunked')

    const writer = transformStream.writable.getWriter()
    writer.write(sseUint8Array)

    // @ts-ignore
    const { message: humanMessage = '' } = rbody
    const getAllHandler = (message: BaseMessage) => {
        console.log(`getAllHandler`, message)
        if (message?.additional_kwargs?.function_call) {
            const availableFunctions: Record<string, Function> = {
                getCurrentWeather: getCurrentWeather,
            }
            const { name: functionName, arguments: functionArguments } = message?.additional_kwargs?.function_call || {}
            const functionToCall = availableFunctions[functionName]
            const functionArgs = JSON.parse(functionArguments)
            const functionResponse: string = functionToCall(functionArgs)

            const messages = [
                new HumanMessage(humanMessage),
                new AIMessage(message),
                new FunctionMessage({
                    name: functionName,
                    content: functionResponse,
                }),
            ]
            getFunctionCallingMessage({
                mseeages: messages,
                // functions: functions,
                streamHanler: (token: string) => {
                    console.log('in getAllHandler', token)
                    writeSSEMessage({ text: token, writer: writer })
                },
            })
        }
    }

    getFunctionCallingMessage({
        humanMessage: humanMessage,
        functions: functions,
        streamHanler: (token: string) => {
            console.log(token)
            writeSSEMessage({ text: token, writer: writer })
        },
        getAllHandler: getAllHandler,
    })

    return response
}

function getCurrentWeather({ location, unit = 'fahrenheit' }: { location: string; unit: string }) {
    const weatherInfo = {
        location: location,
        temperature: '72',
        unit: unit,
        forecast: ['sunny', 'windy'],
    }
    return JSON.stringify(weatherInfo)
}

const functions = [
    {
        name: 'getCurrentWeather',
        description: 'Get the current weather in a given location',
        parameters: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                },
                unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
        },
    },
]

interface IWriteSSEMessageProps {
    text: String
    writer: WritableStreamDefaultWriter<any>
}
const encoder = new TextEncoder()
const writeSSEMessage = ({ text, writer }: IWriteSSEMessageProps) => {
    if (!text) return
    const eventMsgHeader = encoder.encode(`event: message\n`)
    writer.write(eventMsgHeader)
    const message = `data: ${text.replace(/\n/, '\\n')}\n\n`
    const messageUint8Array = encoder.encode(message)
    writer.write(messageUint8Array)
}
