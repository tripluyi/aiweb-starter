import { NextRequest, NextResponse } from 'next/server'
import { getStreamMessage } from '../shared/openai'

import { NextApiRequest, NextApiResponse } from 'next'

export async function GET(request: NextRequest) {
    const sseData = `:ok\n\nevent: message\ndata: Initial message\n\n`
    // 将 SSE 数据编码为 Uint8Array
    const encoder = new TextEncoder()
    const sseUint8Array = encoder.encode(sseData)

    // // 创建 TransformStream
    // const transformStream = new TransformStream();
    // 创建可读流
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(sseUint8Array)
            controller.close()
        },
    })

    // 创建 TransformStream
    const transformStream = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk)
        },
    })

    // 创建 SSE 响应
    let response = new Response(transformStream.readable)
    // 创建 SSE 响应
    // const response: NextResponse = new NextResponse();

    // 设置响应头，指定使用 SSE
    response.headers.set('Content-Type', 'text/event-stream')
    response.headers.set('Cache-Control', 'no-cache')
    response.headers.set('Connection', 'keep-alive')
    response.headers.set('Transfer-Encoding', 'chunked')

    const writer = transformStream.writable.getWriter()
    writer.write(stream)

    // 定义一个计数器
    let counter = 0

    // 每秒发送一个消息
    const interval = setInterval(() => {
        counter++
        const message = `event: message\ndata: Message ${counter}\n\n`
        const messageUint8Array = encoder.encode(message)
        writer.write(messageUint8Array)
    }, 1000)

    // 当客户端断开连接时清除定时器
    response.body
        ?.getReader()
        .closed.then(() => {
            // clearInterval(interval);
            writer.close()
        })
        .catch(e => {
            console.log(`error of close`, e)
        })

    // 返回 SSE 响应
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
