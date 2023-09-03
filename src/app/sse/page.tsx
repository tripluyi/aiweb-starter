import './style.css'

const Sse = () => {
    return (
        <div className=" w-screen bg-gray-800">
            <div className=" mx-auto my-2 w-[968px] relative">
                <h1>SSE</h1>
                <QuestionInput />
            </div>
        </div>
    )
}

export default Sse

const QuestionInput = () => {
    return (
        <div className=" fixed w-[968px] bottom-7">
            <div className="w-full h-12 px-2 text-sm bg-zinc-700 justify-between rounded-lg text-white shadow border border-gray-800 flex flex-row gap-1 relative">
                <input type="text" className=" w-[95%] flex flex-inline outline-none bg-transparent" />
                <div className="flex bg-transparent cursor-pointer h-full align-middle items-center">
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
