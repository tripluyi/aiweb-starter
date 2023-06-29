import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { findSpecificDir } from '@/app/api/util/tools'

export async function GET(request: NextRequest) {
    const rootDir = await findSpecificDir({ startPath: __dirname, specificFile: 'README.md' })
    const pdfworkerjs = path.resolve(rootDir, './node_modules/pdfjs-dist/build/pdf.worker.js')
    let response: NextResponse
    response = await new Promise((resolve, reject) => {
        fs.readFile(pdfworkerjs, (err, data) => {
            let _response: NextResponse
            if (err) {
                _response = new NextResponse(`404 Not Found\n`, { status: 404, statusText: 'Not Found' })
            } else {
                _response = new NextResponse(data, { status: 200 })
            }
            resolve(_response)
        })
    })
    return response
}
