import { NextRequest, NextResponse } from 'next/server'
import { getStreamMessage } from '../shared/openai'
import { NextApiRequest, NextApiResponse } from 'next'

export async function GET(request: NextRequest) {
    let humanMessage = ''
    try {
        humanMessage = request.nextUrl.searchParams.get('message') || ''
    } catch (e) {}

    return SSEResponse(humanMessage)
}

export async function POST(request: NextRequest) {
    let rbody = {}
    try {
        const rtext = await request.text()
        rbody = (rtext && JSON.parse(rtext)) || {}
    } catch (e) {}

    // @ts-ignore
    const { message: humanMessage = '' } = rbody

    return SSEResponse(humanMessage)
}

const SSEResponse = (humanMessage: string) => {
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
    // writer.write(sseUint8Array)
    const eventMsgHeader = encoder.encode(`event: message\n`)
    getStreamMessage({
        humanMessage: humanMessage,
        streamHanler: (token: string) => {
            writer.write(eventMsgHeader)
            const message = `data: ${token.replace(/\n/, '\\n')}\n\n`
            // console.log(`message`, token, message)
            const messageUint8Array = encoder.encode(message)
            writer.write(messageUint8Array)
        },
        getAllHandler: (totalContent: string) => {
            writer.write(eventMsgHeader)
            console.log(`totalContent==>`, totalContent)
            const messageUint8Array = encoder.encode('data: __completed__\n\n')
            writer.write(messageUint8Array)
        },
    })

    // // 定义一个计数器
    // let counter = 0

    // // 每秒发送一个消息
    // const interval = setInterval(() => {
    //     counter++

    //     if (counter > 15) {
    //         clearInterval(interval)
    //         const message = `event: message\ndata: End\n\n`
    //         const messageUint8Array = encoder.encode(message)
    //         writer.write(messageUint8Array)
    //         return
    //     }

    //     const message = `event: message\ndata: Message ${counter} - ${humanMessage}\n\n`
    //     const messageUint8Array = encoder.encode(message)
    //     writer.write(messageUint8Array)
    // }, 100)

    return response
}
export async function sseHandler(req: NextApiRequest, res: NextApiResponse) {
    // 设置响应头，指定使用 SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Transfer-Encoding', 'chunked')

    // 发送初始的 SSE 格式和数据
    res.write(':ok\n\n')
    res.write('event: message\n')
    res.write('data: Initial message\n\n')

    // 定义一个计数器
    let counter = 0

    // 每秒发送一个消息
    const interval = setInterval(() => {
        counter++
        res.write('event: message\n')
        res.write(`data: Message ${counter}\n\n`)
    }, 1000)

    // 当客户端断开连接时清除定时器
    res.on('close', () => {
        clearInterval(interval)
        res.end()
    })
}

export async function XGET(request: NextRequest) {
    const sseData = `:ok\n\nevent: message\ndata: Initial message\n\n`
    // 将 SSE 数据编码为 Uint8Array
    const encoder = new TextEncoder()
    const sseUint8Array = encoder.encode(sseData)

    // 创建 TransformStream
    const transformStream = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk)
        },
    })
    const writer = transformStream.writable.getWriter()
    writer.write(sseUint8Array)

    // 定义一个计数器
    let counter = 0

    // 每秒发送一个消息
    const interval = setInterval(() => {
        counter++
        const message = `event: message\ndata: Message ${counter}\n\n`
        const messageUint8Array = encoder.encode(message)
        writer.write(messageUint8Array)
    }, 1000)

    return new Response(transformStream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache, no-transform',
        },
    })
}
