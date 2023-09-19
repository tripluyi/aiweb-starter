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

function getCurrentWeather({ location, unit = 'celsius' }: { location: string; unit: string }) {
    const weatherInfo = {
        location: location,
        temperature: '29',
        unit: unit,
        forecast: ['sunny', 'windy'],
    }
    return JSON.stringify(weatherInfo)
}

const getTravelProductList = async (): Promise<String> => {
    const travelProductList = [
        {
            name: 'Hawaii',
            price: '1000',
            description:
                'Hawaii is a U.S. state located in the Pacific Ocean. It is the only state outside North America, the only island state, and the only state in the tropics. Hawaii is also one of a handful of U.S. states to have once been an independent nation.',
            image: 'https://images.unsplash.com/photo-1611095789929-4b7b7b0b2b0f?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8aGF3aWF0aCUyMGhvdXNlfGVufDB8fDB8fA%3D%3D&ixlib=rb-1.2.1&w=1000&q=80',
        },
    ]

    return JSON.stringify(travelProductList)
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
    {
        name: 'getProductTravelList',
        description: 'Get a list of travel products based on the given location',
        parameters: {
            type: 'object',
            properties: {
                keyword: {
                    type: 'string',
                    description: 'The destination keyword, e.g. Shanghai, China',
                },
                travelDays: {
                    type: 'number array',
                    description: 'The number of days of the trip, e.g. [3, 5, 7]',
                },
                sortType: {
                    type: 'string',
                    enum: ['price desc', 'price asc', 'rating desc', 'rating asc', 'suggested', 'sales'],
                },
            },
            required: ['keyword'],
        },
    },
]

/*
 * @param keyword: string
 * @param sortType: number
 * @param travelDays: string[] | number[]
 */
const getProductSearchRequestByCondition = ({
    keyword,
    sortType,
    travelDays,
}: {
    keyword: string
    sortType: number
    travelDays: number[]
}) => {
    return {
        requestSource: 'tour',
        client: {
            version: '',
            channel: 114,
            locale: 'zh-CN',
            currency: 'CNY',
            source: 'NVacationSearchV2',
            cid: '',
            location: {
                lat: '',
                lon: '',
                cityId: 2,
                cityType: 3,
                locatedCityId: 0,
            },
        },
        destination: {
            poid: 0,
            type: '',
            keyword: keyword || '',
        },
        filtered: {
            tab: '64',
            preItems: [],
            items: travelDays?.length
                ? [
                      {
                          method: 'FILTERED',
                          type: 'TravelDays',
                          value: travelDays?.join(),
                      },
                  ]
                : [],
            minPrice: 0,
            maxPrice: 0,
            beginDate: '',
            endDate: '',
            sort: sortType || 8,
            pageIndex: 1,
            pageSize: 30,
        },
        searchOption: {
            returnMode: 'all',
            filters: [],
        },
        productOption: {
            needBasicInfo: true,
            needPrice: true,
            tagOption: ['PRODUCT_TAG'],
        },
        extras: {
            USE_NEW_PRICE: 'true',
            FILTERED_SCOPE: 'custom',
        },
    }
}

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
