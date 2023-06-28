import { DiscussServiceClient } from '@google-ai/generativelanguage'
import { GoogleAuth } from 'google-auth-library'
import * as dotenv from 'dotenv'
dotenv.config()

export const MODEL_NAME = 'models/chat-bison-001'

const API_KEY = process.env.google_PaLM_API_KEY || ''

export const client = new DiscussServiceClient({
    authClient: new GoogleAuth().fromAPIKey(API_KEY),
})
