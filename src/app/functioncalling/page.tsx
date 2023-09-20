'use client'
import './style.css'
import { useEffect, useState, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const completedText = '__completed__'

export default function FunctionCalling() {
    const [answer, setAnswer] = useState<string>('')
    useEffect(() => {}, [])

    const handleSSE = async (msg: string) => {
        const ctrl = new AbortController()
        SSEManager.getEventSource({
            msg,
            ctrl,
            callback: sseResult => {
                if (sseResult === completedText) {
                    console.log(`this is completed`)
                    setAnswer(answer => `${answer}\n`)
                } else {
                    setAnswer(answer => `${answer}${sseResult}`)
                }
            },
        })
    }

    return (
        <div className=" w-screen bg-gray-800">
            <div className=" mx-auto my-2 w-[968px] relative">
                <h1>SSE</h1>
                {/* <div className="flex flex-row text-white cursor-pointer">click Me</div> */}
                <div className="flex text-white whitespace-pre-line">{answer}</div>
                <QuestionInput callback={handleSSE} />
            </div>
        </div>
    )
}

interface IQuertionInputProps {
    callback: (msg: string) => void
}
const QuestionInput = ({ callback }: IQuertionInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSend = () => {
        const inputEle: HTMLInputElement | null = inputRef && inputRef.current
        if (inputEle?.value) {
            callback(inputEle.value)
            inputEle.value = ''
        }
    }

    const handleInputKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSend()
        }
    }

    return (
        <div className=" fixed w-[968px] bottom-7">
            <div className="w-full h-12 px-2 text-sm bg-zinc-700 justify-between rounded-lg text-white shadow border border-gray-800 flex flex-row gap-1 relative">
                <input
                    type="text"
                    className=" w-[95%] flex flex-inline outline-none bg-transparent"
                    ref={inputRef}
                    onKeyUp={e => handleInputKeyUp(e)}
                />
                <div
                    className="flex bg-transparent cursor-pointer h-full align-middle items-center"
                    onClick={handleSend}
                >
                    <SendSvg
                        className="h-[60%] w-full items-center text-center text-gray-300"
                        color={'rgb(209 213 219 / 1)'}
                    />
                </div>
            </div>
        </div>
    )
}

const SendSvg = ({ className, color }: { className?: string; color?: string }) => {
    return (
        <svg
            width="512"
            height="512"
            className={className || ''}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fill={color || '#000000'} d="M2.01 21L23 12L2.01 3L2 10l15 2l-15 2z" />
        </svg>
    )
}

interface IEventSourceProps {
    msg: string
    ctrl: AbortController
    callback?: (answer: string) => void
}
const SSEManager = (function () {
    let eventSourceInstance: any = null

    function createEventSource({ msg, ctrl, callback }: IEventSourceProps) {
        if (!eventSourceInstance) {
            // 创建 EventSource 对象
            eventSourceInstance = fetchEventSource('/functioncalling/api/fc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: msg,
                }),
                onmessage: function (event) {
                    console.log('Received message:', event.data)
                    if (event.data.includes(completedText)) {
                        console.log(`this is completed`)
                        callback && callback(completedText)
                        // setAnswer(answer => `${answer}\n`)
                        ctrl.abort()
                        eventSourceInstance = null
                    } else {
                        callback && callback(event.data.replace(/\\n/g, '\n'))
                        // setAnswer(answer => `${answer}${event.data.replace(/\\n/g, '\n')}`)
                    }
                },
                signal: ctrl.signal,
                openWhenHidden: true, // https://github.com/Azure/fetch-event-source/issues/51
            })
        }
    }

    function getEventSource(props: IEventSourceProps) {
        if (!eventSourceInstance) {
            return createEventSource(props)
        }
        console.log(`I have been created`)
        return eventSourceInstance
    }

    return {
        getEventSource,
    }
})()
