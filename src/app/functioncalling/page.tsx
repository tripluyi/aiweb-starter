'use client'
import './style.css'
import { useEffect, useState, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import _ from 'lodash'

const completedText = '__completed__'

type CHATITEM = {
    question?: string
    answer?: string
}
export default function FunctionCalling() {
    const [answer, setAnswer] = useState<string>('')

    const [chatList, setChatList] = useState<CHATITEM[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    useEffect(() => {}, [])

    const handleSSE = async (msg: string) => {
        const ctrl = new AbortController()
        const lastChatItem = chatList[chatList.length - 1]
        if (lastChatItem?.question === msg || loading) return

        setLoading(true)
        // setChatList(chatList => [...chatList, {question: msg}])

        setChatList(chatList => {
            let newChatList = [...chatList]
            let lastChatItem = _.last(newChatList)
            lastChatItem && (lastChatItem.answer = answer)
            newChatList.push({ question: msg })
            return newChatList
        })

        setAnswer('')

        SSEManager.getEventSource({
            msg,
            ctrl,
            callback: sseResult => {
                console.log(`answer X`, answer)
                if (sseResult === completedText) {
                    console.log(`this is completed`)
                    setAnswer(answer => `${answer}\n`)
                    setLoading(false)
                    // console.log(`answer....`, answer)
                    // setChatList(chatList => {
                    //     let newChatList = [...chatList];
                    //     let lastChatItem = _.last(newChatList)
                    //     lastChatItem && (lastChatItem.answer = answer)
                    //     console.log(`answer`, answer)
                    //     console.log(`lastChatItem`, lastChatItem)
                    //     console.log(`newChatList`, newChatList)
                    //     return newChatList
                    // })

                    // // setAnswer("")
                } else {
                    setAnswer(answer => `${answer}${sseResult}`)
                }
            },
        })
    }

    console.log(`ChatList`, chatList)

    return (
        <div className=" w-screen bg-gray-800">
            <div className=" mx-auto my-2 w-[968px] relative">
                <h1 className="text-gray-200 border-b-2 my-8 pb-3">Function Calling</h1>
                {_.map(chatList, (item, index) => {
                    return (
                        <div key={index} className="flex flex-col gap-1 border-b border-dashed border-gray-100 mt-10">
                            <div className="flex text-gray-100 whitespace-pre-line rounded-lg bg-slate-700 p-4">
                                {item.question}
                            </div>
                            <div className="flex text-white whitespace-pre-line rounded-lg px-4 pt-3 pb-10">
                                {item.answer || answer}
                            </div>
                        </div>
                    )
                })}

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
                    // console.log('Received message:', event.data)
                    if (event.data.includes(completedText)) {
                        callback && callback(completedText)
                        eventSourceInstance = null
                        ctrl.abort()
                    } else {
                        // console.log(`event.data`, event.data);
                        callback && callback(event.data.replace(/\\n/g, '\n'))
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
