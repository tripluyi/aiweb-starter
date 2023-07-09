import _ from 'lodash'
import { NextRequest, NextResponse } from 'next/server'
import { speechCheck, IAzureSpeechCheckResult } from '../../../azure/speech'

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
    const type = params.type
    if (type == `gettoken`) {
        const speechCheckResult: IAzureSpeechCheckResult = await speechCheck()
        if (speechCheckResult.status) {
            return NextResponse.json({ ...speechCheckResult }, { status: 200 })
        }
        return NextResponse.json({ ...speechCheckResult }, { status: 401 })
    }
}

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
    const type = params.type
    if (type == `gettoken`) {
        const speechCheckResult: IAzureSpeechCheckResult = await speechCheck()
        if (speechCheckResult.status) {
            return NextResponse.json({ ...speechCheckResult }, { status: 200 })
        }
        return NextResponse.json({ ...speechCheckResult }, { status: 401 })
    }
}
