export interface VectorSaveParams {
    name: string
    contextList: { pageContent: string; metadata?: { [index: string]: any } }[]
}

export interface VectorSimilarParams {
    name: string
    text: string
    topK?: number
    score?: number
}

// ********** helper**********

// try to define a new decimal type
type Decimal1 = number & { __Decimal1: true }

function createDecimal1(value: number): Decimal1 {
    if (
        !Number.isFinite(value) ||
        Math.abs(value * 10 - Math.floor(value * 10 + 0.5)) >= Number.EPSILON ||
        value <= 0
    ) {
        throw new TypeError(`${value} is not a valid Decimal1 value.`)
    }
    return value as Decimal1
}

let decimal1Value: Decimal1
decimal1Value = createDecimal1(1.23) // 正确
