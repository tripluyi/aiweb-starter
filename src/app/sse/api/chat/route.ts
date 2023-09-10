import { NextRequest, NextResponse } from 'next/server'
import { PaLMCall, PaLMByLangChain } from '../shared/PaLM'
import { getStreamMessage } from '../shared/openai'

export async function GET(request: NextRequest) {
    const msg = request?.nextUrl?.searchParams?.get('msg') || ''
    const result = await PaLMByLangChain({
        msgContent: msg,
    })

    return NextResponse.json({ ...result })
}

export async function POST(request: NextRequest) {
    const result = {}
    return NextResponse.json({ ...result })
}
