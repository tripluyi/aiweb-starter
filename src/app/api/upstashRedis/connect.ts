import { upstashRedis } from './common'
import type { RedisValue } from './common'

export const RedisGet = async (key: string | undefined) => {
    if (!key) return null
    const data: any = await upstashRedis.get(key)
    return data
}

export const RedisSet = async (key: string | undefined, value: RedisValue) => {
    if (!key) return null
    if (!value) return await RedisGet(key)
    const data = await upstashRedis.set(key, value)
    if (data === `OK`) return value
    return null
}
