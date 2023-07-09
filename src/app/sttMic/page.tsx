// Speech to text by microphone
import _ from 'lodash'
import React, { useEffect, useState, useCallback } from 'react'
import { fetchTokenOrRefresh } from './API'
const speechsdk = require('microsoft-cognitiveservices-speech-sdk')
type AnyObj = {
    [index: string]: any
}
interface SpeechToken {
    authToken: string
    region: string
}

const recordingIdleGap = 3000 // 3s recording to idle gap

enum RECORDING_STATUS {
    idle = 'idle',
    recording = 'recording',
    recorded = 'recorded',
}

const SttMic = () => {
    const [speechToken, setSpeechToken] = useState<SpeechToken | undefined>(undefined)
    const [triggerMic, setTriggerMic] = useState(false)
    const [stateRecognizer, setStateRecognizer] = useState(null)

    useEffect(() => {
        fetchToken(token => {
            setSpeechToken(token)
        })
    }, [])

    useEffect(() => {
        if (!speechToken) {
            fetchToken(token => {
                setSpeechToken(token)
            })
        } else if (triggerMic) {
            sttFromMic(stateRecognizer, speechToken, handleRecording, (recognizer: any) => {
                if (recognizer) {
                    setStateRecognizer(recognizer)
                }
            })
        }
    }, [triggerMic])

    let lastRecordingInfo: any = {},
        recordingIdleTimer: any = null
    const handleRecording = (result: any) => {
        const { resultId, text, offset, duration } = result || {}
        const lastResultoffset = lastRecordingInfo?.offset
        const lastText = lastRecordingInfo?.text || ``
        if (!!lastResultoffset && lastResultoffset != offset) {
            // record done and set lastText
            /*
            dispatch(updateRecording({
                text: lastText,
                recordingText: text,
                status: RECORDING_STATUS.recorded,
            }))
            */
        } else {
            // continue recording
            /*
            dispatch(updateRecording({
                recordingText: text,
                status: RECORDING_STATUS.recording,
            }))
            */
        }

        // after 3s later, dispatch to update recording and clear recording info cache
        clearTimeout(recordingIdleTimer)
        recordingIdleTimer = setTimeout(() => {
            lastRecordingInfo = {}
            // set status to RECORDING_STATUS.idle,
            /*
            dispatch(updateRecording({
                status: RECORDING_STATUS.idle,
            }))
            */
        }, recordingIdleGap)

        lastRecordingInfo = {
            resultId,
            text,
            offset,
            duration,
        }
    }
    const handleStopMic = useCallback(() => {
        if (stateRecognizer) {
            pauseMic(stateRecognizer)
            setTriggerMic(false)
        }
    }, [stateRecognizer])

    return (
        <div className="w-10 inline-block text-right">
            <div
                onClick={() => {
                    triggerMic ? handleStopMic() : setTriggerMic(true)
                }}
                className="inline-block w-6 cursor-pointer align-bottom"
            >
                {triggerMic ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                        />
                    </svg>
                )}
            </div>
        </div>
    )
}

export default SttMic

const sttFromMic = async (
    stateRecognizer: any,
    speechToken: SpeechToken,
    recording: (arg: any) => void,
    callback?: (arg?: any) => void
) => {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(speechToken.authToken, speechToken.region)
    speechConfig.speechRecognitionLanguage = 'zh-CN'

    let recognizer
    if (!stateRecognizer) {
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput()
        recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig)
    } else {
        recognizer = stateRecognizer
        recognizer.startContinuousRecognitionAsync()
        callback && callback()
        return
    }

    recognizer.recognizing = function (s: any, e: AnyObj) {
        recording(e?.result)
    }

    recognizer.startContinuousRecognitionAsync()

    if (callback) {
        callback(recognizer)
    }
}

const pauseMic = async (recognizer: any) => {
    recognizer.stopContinuousRecognitionAsync()
}
// ********** fetch **********
const fetchToken = async (callback?: (arg: SpeechToken) => void) => {
    const tokenRes = await fetchTokenOrRefresh()
    if (tokenRes?.status) {
        if (callback) {
            callback({
                authToken: tokenRes?.authToken,
                region: tokenRes?.region,
            })
        }
    }

    return tokenRes || {}
}
