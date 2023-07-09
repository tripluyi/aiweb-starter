import Cookie from 'universal-cookie'
import _ from 'lodash'
type AnyObj = {
    [index: string]: any
}

const commonOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
}

export const fetchTokenOrRefresh = async () => {
    const cookie = new Cookie()
    const speechTokenCookieName = 'speech-token'
    const speechToken = cookie.get(speechTokenCookieName)

    if (speechToken === undefined) {
        try {
            const response = await fetch('/api/speech/gettoken', {
                ...commonOptions,
                method: 'GET',
            })
            const result = await response.json()
            const { token, region } = result || {}
            cookie.set(speechTokenCookieName, region + ':' + token, { maxAge: 540, path: '/' })
            console.log('Token fetched from back-end: ' + token)
            return { status: true, authToken: token, region: region }
        } catch (err) {
            return { status: false, authToken: null, errorInfo: err }
        }
    } else {
        console.log('Token fetched from cookie: ' + speechToken)
        const idx = speechToken.indexOf(':')
        return { status: true, authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) }
    }
}
