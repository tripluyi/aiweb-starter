import MicrosoftSpeechSdk from 'microsoft-cognitiveservices-speech-sdk'
import _ from 'lodash'
import type { NextApiRequest, NextApiResponse } from 'next'
import * as dotenv from 'dotenv'
dotenv.config()

const { azureSpeechKey = '', azureSpeechregion = '' } = process.env || {}

// const speechConfig = MicrosoftSpeechSdk.SpeechConfig.fromSubscription(azureSpeechKey, azureSpeechregion);
// speechConfig.speechRecognitionLanguage = "zh-CN";
// https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=stt#speech-to-text

export interface IAzureSpeechCheckResult {
    status: boolean
    token?: string
    region?: string
    error?: {
        message: string
    }
}
export const speechCheck = async (): Promise<IAzureSpeechCheckResult> => {
    if (!azureSpeechKey || !azureSpeechregion) {
        return {
            status: false,
            error: {
                message: 'auth failed',
            },
        }
    }

    const params = {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': azureSpeechKey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: null,
    }

    try {
        const tokenResponse: any = await fetch(
            `https://${azureSpeechregion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            params
        )
        const tokenResponseResult = await tokenResponse.text()
        if (tokenResponseResult) {
            return {
                status: true,
                token: tokenResponseResult,
                region: azureSpeechregion,
                // tokenResponse
            }
        }

        return {
            status: false,
            error: {
                message: 'There was an error authorizing your speech key. no tokenResponse data',
            },
        }
    } catch (err) {
        console.log(`AzureSpeechCheck`, { err })
        return {
            status: false,
            error: {
                message: 'There was an error authorizing your speech key.',
            },
        }
    }
}

// https://github.com/Azure-Samples/AzureSpeechReactSample
