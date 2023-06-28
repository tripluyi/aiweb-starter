import _ from 'lodash'
import { NextRequest, NextResponse } from 'next/server'
import { VectorSimilarParams } from '../../interface'
import { getEmbeddings } from '../../azure/connect'
import { findSimilar } from '../../pinecone/connect'
import { openaiPineconeIndex } from '../../pinecone/common'
export async function POST(request: NextRequest) {
    const body: VectorSimilarParams = await request.json()

    const resultJson = vectorSimilar({ ...body, score: 0.1 })
    return NextResponse.json({ ...resultJson }, { status: 200 })
}

const vectorSimilar = async (body: VectorSimilarParams) => {
    const { text, name: namespace } = body || {}
    const returnResuslt = {
        status: -1,
        error: {
            message: ``,
        },
    }
    if (!text || !namespace)
        return {
            ...returnResuslt,
            error: {
                ...returnResuslt.error,
                message: `text or namespace is requried.`,
            },
        }

    const queryVectors = await getEmbeddings({
        textList: [text],
    })
    const queryVector = queryVectors?.[0]
    if (_.isEmpty(queryVector)) {
        return {
            ...returnResuslt,
            error: {
                ...returnResuslt.error,
                message: `fail to get query vector`,
            },
        }
    }

    const result = await findSimilar({
        index: openaiPineconeIndex,
        namespace,
        vector: queryVector,
    })

    if (_.isEmpty(result?.[0]))
        return {
            ...returnResuslt,
            error: {
                ...returnResuslt.error,
                message: `there is no result.`,
            },
            result,
        }

    const getAllContentOverSeven = _.compact(
        _.map(result, r => {
            const { metadata, score } = r || {}
            if (score > 0.1 && metadata?.pageContent) {
                return metadata.pageContent
            } else {
                return null
            }
        })
    )
    if (!getAllContentOverSeven?.length) {
        return {
            ...returnResuslt,
            error: {
                ...returnResuslt.error,
                message: `there is no similar content over`,
            },
            result,
        }
    }

    return {
        status: 0,
        content: getAllContentOverSeven.join('\n'),
    }
}
