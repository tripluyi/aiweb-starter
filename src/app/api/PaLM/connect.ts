// google PaLM API
import { client, MODEL_NAME } from './common'
const context =
    'you are an interviewee, the job is web front-end developer. I am interviewer. now you start answer my question.'
const examples = [
    {
        input: {
            content: 'do you have experience of react?',
        },
        output: {
            content:
                'Yes, I have experience with React. I have used it to build several web applications, including a social media platform and a e-commerce website. I am familiar with the React lifecycle, and I am able to use React components to build complex user interfaces. I am also familiar with React hooks, which allow me to write more concise and reusable code.\r\n\r\nReact is a JavaScript library for building user interfaces. It is declarative, efficient, and flexible. React makes it easy to create complex user interfaces with a small amount of code. It is also very popular, so there is a large community of developers who can help you if you have any problems.\r\n\r\nI believe that my experience with React makes me a strong candidate for the job of web front-end developer. I am confident that I can use my skills to build high-quality user interfaces that meet your needs.',
        },
    },
]
const messages = [
    {
        content:
            'what about redux, do you have experience of redux? and please tell me more about your experience of react.',
    },
]

export const PaLMCall = async () => {
    // res.status(200).json({ name: 'John Doe' })
    const result = await new Promise((resolve, reject) => {
        client
            .generateMessage({
                // required, which model to use to generate the result
                model: MODEL_NAME,
                // optional, 0.0 always uses the highest-probability result
                temperature: 0.25,
                // optional, how many candidate results to generate
                candidateCount: 1,
                // optional, number of most probable tokens to consider for generation
                // topK: 40,
                // optional, for nucleus sampling decoding strategy
                // topP: 0.95,
                prompt: {
                    // optional, sent on every request and prioritized over history
                    context: context,
                    // optional, examples to further finetune responses
                    examples: examples,
                    // required, alternating prompt/response messages
                    messages: messages,
                },
            })
            .then((result: any) => {
                console.log(JSON.stringify(result, null, 2))
                resolve(result)
            })
            .catch((err: any) => {
                console.log(`PaLMCall`, { err })
                resolve(err)
            })
    })

    return { result }
}
