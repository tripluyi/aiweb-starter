# aiweb-starter
这是一个关于 AI 调用示例的仓库，更多介绍可以查看 [Wiki](https://ctrip.wiki/)

## 开始

安装
```bash
npm i
```

启动
```bash
npm run dev
```


## 使用
该项目中，每一个例子都可以独立运行，代码互不影响。

初次使用，需要创建.env 文件，并将 .env.example 内示例环境变量拷贝至 .env，填入自己真实的API Key
```bash
mv .env.example .env
```
<br />

|case|启动地址|使用介绍|
|--|--|--|
|**function calling**|http://localhost:3000/functioncalling|[OpenAI Function Calling的使用](https://aiweb.viku.org/practice/openai-function-calling)|
|**Server-sent Events**|http://localhost:3000/sse|[Server-Sent Events流式对话](https://aiweb.viku.org/practice/serversent-events-liu-shi-dui-hua)|
|**Speach To Text**|*TODO*|[结合语音输入实现对话](https://aiweb.viku.org/practice/jie-he-yu-yin-shu-ru-shi-xian-dui-hua)|
|**Vector Embeddings**|*TODO*|[通过Embeddings实现PDF检索](https://aiweb.viku.org/practice/tong-guo-embeddings-shi-xian-pdf-jian-suo)|




