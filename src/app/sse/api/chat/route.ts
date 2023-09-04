import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const result = {}
    return NextResponse.json({ ...result })
}

export async function POST(request: NextRequest) {
    const result = {}
    return NextResponse.json({ ...result })
}
