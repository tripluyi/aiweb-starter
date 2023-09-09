'use client'
import './style.css'
import { useEffect, useState, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const Sse = () => {
    const [answer, setAnswer] = useState<string>('')
    useEffect(() => {}, [])

    const handleSSE = async (msg: string, isGET?: boolean) => {
        if (isGET) {
            const eventSource = new EventSource('/sse/api/stream?message=' + msg)
            // 监听 SSE 事件的消息
            eventSource.onmessage = function (event) {
                console.log('Received message:', event.data)
                if (event.data.includes('__completed__')) {
                    console.log(`this is completed`)
                    setAnswer(answer => `${answer}\n`)
                } else {
                    setAnswer(answer => `${answer}${event.data.replace(/\\n/g, '\n')}`)
                }
            }
            return
        }

        const ctrl = new AbortController()
        const eventSourcePost = fetchEventSource('/sse/api/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: msg,
            }),
            onmessage: function (event) {
                console.log('Received message:', event.data)
                if (event.data.includes('__completed__')) {
                    console.log(`this is completed`)
                    setAnswer(answer => `${answer}\n`)
                    ctrl.abort()
                } else {
                    setAnswer(answer => `${answer}${event.data.replace(/\\n/g, '\n')}`)
                }
            },
            signal: ctrl.signal,
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

export default Sse

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
