import _ from 'lodash'
import * as dotenv from 'dotenv'
dotenv.config()

const API_KEY = process.env.openweathermapAPI || ''

export const getGeoLocation = async ({ city, countryCode }: { city: string; countryCode?: string }) => {
    const keyword = `${encodeURIComponent(city)}${countryCode ? ',' + countryCode : ''}`
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=1&appid=${API_KEY}`

    let geoInfo = {
        lat: -1,
        lon: -1,
        country: '',
        city: '',
        state: '',
    }
    try {
        const geoRes = await fetch(url)
        const geoResult = await geoRes.json()
        geoInfo = {
            lat: geoResult?.[0]?.lat,
            lon: geoResult?.[0]?.lon,
            country: geoResult?.[0]?.country,
            city: geoResult?.[0]?.name,
            state: geoResult?.[0]?.state,
        }
    } catch (e) {
        console.log(`getGeoLocation error`, e)
    }

    console.log(`geoInfo`, geoInfo)
    return geoInfo
}

export const getCurrentWeather = async ({ lat, lon, lang }: { lat: number; lon: number; lang?: string }) => {
    let weatherInfo = {
        temperature_max: '',
        temperature_min: '',
        unit: `celsius`,
        current_weather: '',
        description: '',
        pressure: '',
        humidity: '',
        wind_speed: '',
        wind_deg: '',
    }

    if (!lat || !lon) {
        return null
    }

    lang = lang || 'zh_cn'
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=${lang}&units=metric`

    try {
        const weatherRes = await fetch(url)
        const weatherResult = await weatherRes.json()
        const { main, weather, wind } = weatherResult || {}
        weatherInfo = {
            ...weatherInfo,
            temperature_max: main?.temp_max,
            temperature_min: main?.temp_min,
            current_weather: weather?.[0]?.main,
            description: weather?.[0]?.description,
            pressure: main?.pressure,
            humidity: main?.humidity,
            wind_speed: wind?.speed,
            wind_deg: wind?.deg,
        }
    } catch (e) {
        console.log(`getCurrentWeather error`, e)
    }

    console.log(`weatherInfo`, weatherInfo)
    return weatherInfo
}

export const getCurrentWeatherByCity = async ({ city, countryCode }: { city: string; countryCode?: string }) => {
    const geoInfo = await getGeoLocation({ city, countryCode })
    const weatherInfo = await getCurrentWeather({ lat: geoInfo?.lat, lon: geoInfo?.lon })
    const allInfo = {
        ...geoInfo,
        ...weatherInfo,
    }

    console.log(`allInfo`, allInfo)
    return allInfo
}
