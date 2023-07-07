import _ from 'lodash'
import { NextRequest, NextResponse } from 'next/server'
import { speechCheck, IAzureSpeechCheckResult } from '../../../azure/speech'

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
    const type = params.type
    const { searchParams } = new URL(request.url)
    const content = searchParams.get('content') || ``
    return NextResponse.json({ type, content }, { status: 200 })
}

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
    const type = params.type
    if (type == `check`) {
        const speechCheckResult: IAzureSpeechCheckResult = await speechCheck()
        if (speechCheckResult.status) {
            return NextResponse.json({ ...speechCheckResult }, { status: 200 })
        }
        return NextResponse.json({ ...speechCheckResult }, { status: 401 })
    }
}
