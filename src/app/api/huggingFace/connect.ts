import _ from 'lodash'
import { modelHuggingFaceEmbeddings, modelHuggingFaceInference, modelHuggingFaceRest, embeddingModel } from './common'
// TODO need to setup proxy for HF request

export const getEmbeddingsFromLangchain = async ({
    textList,
    retry,
}: {
    textList: string[]
    retry?: number
}): Promise<number[][]> => {
    retry = retry === undefined || isNaN(retry) ? 1 : retry
    let response: number[][] = []
    if (!(retry > 0)) {
        console.log(`getEmbeddingsFromLangchain failed, retry:`, retry)
        return response
    }

    try {
        response = await modelHuggingFaceEmbeddings.embedDocuments(textList)
        console.log(`getEmbeddingsFromLangchain response`, response)
        if (!_.isEmpty(response)) return response
    } catch (e) {
        retry--
        console.log(`getEmbeddingsFromLangchain error, retry`, retry, e)
        return getEmbeddingsFromLangchain({ textList, retry })
    }

    return response
}

export const getEmbeddingsFromHfInference = async ({
    textList,
    retry,
}: {
    textList: string[]
    retry?: number
}): Promise<number[][]> => {
    retry = retry === undefined || isNaN(retry) ? 1 : retry
    let response: number[][] = []
    if (!(retry > 0)) {
        console.log(`getEmbeddingsFromHfInference failed, retry:`, retry)
        return response
    }

    try {
        const fetchResponse = (await modelHuggingFaceInference.featureExtraction({
            model: embeddingModel.distilbertBaseNliMeanTokens,
            inputs: textList,
        })) as number[] | number[][]

        // @ts-ignore
        if (fetchResponse?.[0] && !fetchResponse[0]?.[0]) {
            response = [fetchResponse as number[]]
        } else {
            response = fetchResponse as number[][]
        }
        console.log(`getEmbeddingsFromHfInference response`, response)
        if (!_.isEmpty(response)) return response
    } catch (e) {
        retry--
        console.log(`getEmbeddingsFromHfInference error, retry`, retry, e)
        return getEmbeddingsFromLangchain({ textList, retry })
    }

    return response
}

export const getEmbeddingsFromRestapi = async ({
    textList,
    retry,
    wait_for_model,
}: {
    textList: string[]
    retry?: number
    wait_for_model?: boolean
}): Promise<number[][]> => {
    let response: number[][] = []
    const { url, params } = modelHuggingFaceRest || {}
    const body = {
        inputs: textList,
    }
    retry = retry === undefined || isNaN(retry) ? 1 : retry
    if (!(retry > 0)) {
        console.log(`getEmbeddingsFromRestapi failed, retry:`, retry)
        return response
    }

    try {
        const fetchReturn = await fetch(`${url}${embeddingModel.distilbertBaseNliMeanTokens}`, {
            ...params,
            body: JSON.stringify(body),
        })

        // if there is no wait_for_model and status is 503, try again
        if (fetchReturn.status === 503 && !wait_for_model) {
            console.log(`getEmbeddingsFromRestapi 503, retry`, retry)
            // retry--
            return getEmbeddingsFromRestapi({ textList, retry, wait_for_model: true })
        }
        response = await fetchReturn.json()
        if (response?.[0] && !response[0]?.[0]) {
            // @ts-ignore
            response = [response]
        }

        if (!_.isEmpty(response)) return response
    } catch (e) {
        retry--
        console.log(`getEmbeddingsFromRestapi error, retry`, retry, e)
        return getEmbeddingsFromRestapi({ textList, retry })
    }

    return response
}
