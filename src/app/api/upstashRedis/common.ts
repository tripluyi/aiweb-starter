import { Redis } from '@upstash/redis'
import * as dotenv from 'dotenv'
dotenv.config()

const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env || {}
enum REDIS_ACTIONS {
    GET = `get`,
    SET = `set`,
}
export const upstashRedis = new Redis({
    // @ts-ignore
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
})

export type RedisValue = string | any[] | { [index: string]: any } | undefined
