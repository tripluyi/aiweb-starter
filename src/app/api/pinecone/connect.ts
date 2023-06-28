import _ from 'lodash'
import { Vector, QueryRequest } from '@pinecone-database/pinecone'
import {
    IndexBaseUrl,
    VectorBaseUrl,
    VectorUpsertUrl,
    VectorDeltUrl,
    VectorQueryUrl,
    defaultDimension,
    commonHeaders,
    jsonContentType,
} from './common'
import { sleep } from '../util'

export const getIndex = async ({ index }: { index: string }) => {
    let headers: Partial<typeof commonHeaders> = { ...commonHeaders }
    delete headers['content-type']

    const params = {
        method: 'GET',
        headers,
        body: null,
    }
    try {
        const result = await fetch(IndexBaseUrl, params)
        const res = await result.json()
        if (res?.includes(index)) return index
    } catch (e) {
        console.log(`index error`, e)
    }
    return false
}

export const createIndex = async ({ index, dimension }: { index: string; dimension?: number }) => {
    const checkExisted = await getIndex({ index })
    if (checkExisted) return checkExisted

    const body = {
        metric: 'cosine',
        pods: 1,
        replicas: 1,
        pod_type: 'p1.x1',
        dimension: dimension || defaultDimension,
        name: index,
    }
    try {
        const headers: Partial<typeof commonHeaders> = { ...commonHeaders }
        const params = {
            method: 'POST',
            headers: {
                ...headers,
                accept: 'text/plain',
            },
            body: JSON.stringify(body),
        }
        console.log(params)
        const result = await fetch(IndexBaseUrl, params)
        console.log(`result.status`, result.status)
        if (result.status == 201) {
            return index
        }
        const res = await result.text()
        console.log(`createIndex, fail`, res)
        return false
    } catch (e) {
        console.log(`createIndex, error`, e)
    }
    return false
}

export const insert = async ({
    index,
    vectors,
    namespace,
    retry,
}: {
    index?: string
    vectors: Vector[]
    namespace?: string
    retry?: number
}): Promise<number> => {
    if (!index) return 0
    retry = retry === undefined || isNaN(retry) ? 3 : retry
    if (!(retry > 0)) {
        console.log(`insert failed, retry:`, retry)
        return 0
    }
    const url = VectorUpsertUrl.replace(`{{index}}`, index)

    try {
        let body: { vectors: Vector[]; namespace?: string } = { vectors: vectors }
        if (namespace) body.namespace = namespace
        const headers: Partial<typeof commonHeaders> = { ...commonHeaders }
        const params = {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        }
        console.log(`insert params`, params)
        const result = await fetch(url, params)
        if (result.status == 200) {
            const res = await result.json()
            console.log(`insert succeess`)
            return (res?.upsertedCount as number) || 0
        }
        const error = await result.json()
        console.log(`insert result.status`, result.status, error)
        retry--
        console.log(`retry,`, retry)
        await sleep(0.1)
        return insert({ index, vectors, namespace, retry })
    } catch (e) {
        retry--
        console.log(`insert error and retry`, retry, e)
        await sleep(0.1)
        return insert({ index, vectors, namespace, retry })
    }

    return 0
}

export const findSimilar = async ({
    index,
    namespace,
    topK,
    filter,
    includeValues,
    includeMetadata,
    vector,
    id,
}: Partial<QueryRequest> & { index: string }) => {
    const url = VectorQueryUrl.replace(`{{index}}`, index)
    let body: any = {
        includeValues: includeValues || false,
        includeMetadata: includeMetadata == undefined ? true : includeMetadata || false,
        vector: vector,
        topK: topK || 10,
    }
    if (!_.isEmpty(filter)) body.filter = filter
    if (id) body.id = id
    if (namespace) body.namespace = namespace
    const headers: Partial<typeof commonHeaders> = { ...commonHeaders }
    const params = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    }
    try {
        const result = await fetch(url, params)
        if (result.status == 200) {
            const res = await result.json()
            if (!_.isEmpty(res?.matches)) {
                return res.matches
            }
        }
    } catch (e) {
        console.log(`findSimilar error`, e)
    }

    return []
}

export const deleteAllVectors = async ({ index, namespace }: { index: string; namespace?: string }) => {
    const url = VectorDeltUrl.replace(`{{index}}`, index)
    let body: any = { deleteAll: true }
    if (namespace) body.namespace = namespace
    const headers: Partial<typeof commonHeaders> = { ...commonHeaders }
    const params = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    }
    try {
        const result = await fetch(url, params)
        if (result.status == 200) {
            const res = await result.json()
            console.log(`deleteAllVectors res`, res)
            return true
        }
        console.log(`deleteAllVectors fail`, result)
        return false
    } catch (e) {
        console.log(`deleteAllVectors error`, e)
    }

    return false
}
