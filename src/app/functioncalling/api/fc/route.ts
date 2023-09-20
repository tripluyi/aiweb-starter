import { NextRequest, NextResponse } from 'next/server'
import { getFunctionCallingMessage, getFunctionCallingMessageOpenai } from '../shared/openai'
import type { BaseMessage } from 'langchain/schema'
import { HumanMessage, AIMessage, AIMessageChunk, FunctionMessage, SystemMessage } from 'langchain/schema'
import _ from 'lodash'

export async function POST(request: NextRequest) {
    let rbody = {}
    try {
        const rtext = await request.text()
        rbody = (rtext && JSON.parse(rtext)) || {}
    } catch (e) {}

    // 将 SSE 数据编码为 Uint8Array
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    // const sseData = `:ok\n\nevent: message\ndata: Initial message\n\n`
    const sseData = `:ok\n\nevent: message\ndata: \n\n`
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
    const getAllHandler = async (message: BaseMessage) => {
        console.log(`getAllHandler===>`, message)
        if (message?.additional_kwargs?.function_call) {
            const availableFunctions: Record<string, Function> = {
                getCurrentWeather: getCurrentWeather,
                getTravelProductList: getTravelProductList,
            }
            const { name: functionName, arguments: functionArguments } = message?.additional_kwargs?.function_call || {}
            const functionToCall = availableFunctions[functionName]
            const functionArgs = JSON.parse(functionArguments)
            const functionResponse: string = await functionToCall(functionArgs)

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
                getAllHandler: (message: BaseMessage) => {
                    writeSSEMessage({ text: '__completed__', writer: writer })
                },
            })
        }
    }

    getFunctionCallingMessage({
        humanMessage: humanMessage,
        functions: functions,
        streamHanler: (token: string) => {
            console.log(`streamHanler==>`, token)
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

const sortTypeMap: Record<string, number> = {
    default: 8,
    sales: 2,
    ratingDesc: 4,
    priceDesc: 6,
    priceAsc: 5,
}
const getTravelProductList = async ({
    keyword,
    sortType,
    travelDays,
}: {
    keyword: string
    sortType: string
    travelDays: number[]
}): Promise<String> => {
    console.log(`getTravelProductList`, { keyword, sortType, travelDays })

    const sortTypeNumber = sortTypeMap[sortType] || sortTypeMap.default
    const requestParams = getProductSearchRequestByCondition({ keyword, sortType: sortTypeNumber, travelDays })
    const params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
    }

    const url = `https://online.ctrip.com/restapi/soa2/20684/productSearch`
    let productList: any = []
    try {
        const productListRes = await fetch(url, {
            ...params,
        })
        const productListResult = await productListRes.json()
        if (!_.isEmpty(productListResult?.products)) {
            productList = _.map(productListResult?.products, (product: any) => {
                const { basicInfo, priceInfo, tagGroups } = product || {}
                const tags = tagGroups?.[0]?.tags
                return {
                    id: product?.id,
                    name: basicInfo?.mainName,
                    subName: basicInfo?.subName,
                    price: priceInfo?.price,
                    description: basicInfo?.name,
                    tags: _.isEmpty(tags)
                        ? []
                        : _.map(tags, (tag: any) => {
                              return tag?.tagName || ''
                          }),
                }
            })
        }
    } catch (e) {
        console.log(`getTravelProductList error`, e)
    }

    return JSON.stringify(_.take(productList, 3))
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
        name: 'getTravelProductList',
        description: 'Get a list of travel products based on the given location',
        parameters: {
            type: 'object',
            properties: {
                keyword: {
                    type: 'string',
                    description: 'The destination keyword, e.g. Shanghai, China',
                },
                travelDays: {
                    type: 'array',
                    items: {
                        type: 'number',
                    },
                    description: 'The number of days of the trip, e.g. [3, 5, 7]',
                },
                sortType: {
                    type: 'string',
                    enum: ['priceDesc', 'priceAsc', 'ratingDesc', 'default', 'sales'],
                    description: 'The sort type of product list show, e.g. priceDesc',
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
