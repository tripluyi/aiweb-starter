import { modelTextEmbeddingAda002, modelChatGPT35Turbo } from './common'
import _ from 'lodash'
import { RedisSet, RedisGet } from '../upstashRedis/connect'
import { BufferMemory } from 'langchain/memory'
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
} from 'langchain/prompts'
import { ConversationChain } from 'langchain/chains'
import * as dotenv from 'dotenv'
dotenv.config()

export const getEmbeddings = async ({
    textList,
    retry,
}: {
    textList: string[]
    retry?: number
}): Promise<number[][]> => {
    retry = retry === undefined || isNaN(retry) ? 1 : retry
    if (!(retry > 0)) {
        console.log(`getEmbeddings failed, retry:`, retry)
        return []
    }

    try {
        const response = await modelTextEmbeddingAda002.embedDocuments(textList)
        console.log(`getEmbeddings response`, response)
        if (!_.isEmpty(response)) return response
    } catch (e) {
        retry--
        console.log(`getEmbeddingsFromOpenai error, retry`, retry, e)
        return getEmbeddings({ textList, retry })
    }

    return []
}

export const memoryChat = async (params: {
    isAiAsk?: boolean
    systemChatText: string
    memoryChatKey: string
    aiResponse?: string
    humanSay: string
    noMemory?: boolean
    chatTimestamp: string | number
}) => {
    const { isAiAsk, systemChatText, memoryChatKey, humanSay, aiResponse, noMemory, chatTimestamp } = params || {}
    try {
        const memoryHistory = 'history'
        const systemChatMessage = SystemMessagePromptTemplate.fromTemplate(systemChatText)
        const humanChatMessage = HumanMessagePromptTemplate.fromTemplate('{input}')
        const chatPrompt = ChatPromptTemplate.fromPromptMessages([
            systemChatMessage,
            new MessagesPlaceholder(memoryHistory),
            humanChatMessage,
        ])

        let redisChatMessages: any = []
        let memory = new BufferMemory({ returnMessages: true, memoryKey: memoryHistory })
        // try to restore memory chatHistory from redis
        if (memoryChatKey) {
            const infoFromRedis = await updateChatHistoryFromRedis(memoryChatKey, memory, isAiAsk)
            memory = infoFromRedis.memory
            redisChatMessages = infoFromRedis.redisChatMessages || redisChatMessages
        }

        let chain = new ConversationChain({
            memory: memory,
            prompt: chatPrompt,
            llm: modelChatGPT35Turbo,
        })

        const response = await chain.call({
            input: `${humanSay}`,
        })

        const latestAiResponse = response?.response
        if (latestAiResponse) {
            let memoryChatMessages: { ai: string; human: string; timestamp: number }[]
            if (noMemory) {
                // not store to redis
                memoryChatMessages = redisChatMessages
            } else if (aiResponse) {
                // store ai response from request in redis
                memoryChatMessages = _.concat(redisChatMessages, [
                    {
                        ai: aiResponse,
                        human: humanSay,
                        timestamp: chatTimestamp,
                    },
                ])
            } else {
                memoryChatMessages = _.concat(redisChatMessages, [
                    {
                        ai: latestAiResponse,
                        human: humanSay,
                        timestamp: chatTimestamp,
                    },
                ])
            }

            await storeChatHistoryToRedis(memoryChatKey, memoryChatMessages)

            return { answer: latestAiResponse, memoryChatKey, memoryMessags: memoryChatMessages }
        }
    } catch (e) {
        return { error: e, memoryChatKey }
    }

    return { answer: ``, memoryChatKey }
}

const storeChatHistoryToRedis = async (
    memoryChatKey: string,
    chatMessages: { ai: string; human: string; timestamp: number }[]
) => {
    if (!memoryChatKey || _.isEmpty(chatMessages)) return

    const redisChatMessages = _.map(chatMessages, chatMessage => {
        return {
            ...chatMessage,
        }
    })

    await RedisSet(memoryChatKey, redisChatMessages)
}

const updateChatHistoryFromRedis = async (memoryChatKey: string, memory: BufferMemory, isAiAsk?: boolean) => {
    if (!memoryChatKey) return { memory }

    let redisChatMessages = await RedisGet(memoryChatKey)
    if (_.isEmpty(redisChatMessages)) return { memory }

    _.map(redisChatMessages, redisChatMessage => {
        const { ai, human, type } = redisChatMessage || {}
        if (ai && human && type !== 'system') {
            if (isAiAsk) {
                memory.chatHistory.addAIChatMessage(ai)
                memory.chatHistory.addUserMessage(human)
            } else {
                memory.chatHistory.addUserMessage(human)
                memory.chatHistory.addAIChatMessage(ai)
            }
        }
    })

    return { memory, redisChatMessages }
}
