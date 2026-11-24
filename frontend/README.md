# DSP DevHub 初代交互原型

静态页面与交互源码位于 `src/`，使用 TypeScript 编译。当前数据均为模拟数据，上传、下载与自动任务尚未接入后端。首页问答接入本机 Ollama 的 `qwen3:0.6b`，对话只保留在当前页面内。

```bash
npm ci
npm run build
OLLAMA_BASE_URL=http://127.0.0.1:11434 npm start
```

访问 <http://localhost:8080/>。修改 TypeScript 后重新运行 `npm run build`。目前迁移版仅进行 TypeScript 编译，原有交互代码的严格类型检查尚待逐步完善。

容器运行：

```bash
docker build -t dsp-devhub-frontend .
docker run -d --name dsp-devhub-frontend -p 18080:8080 dsp-devhub-frontend
```

访问 <http://localhost:18080/>。

容器默认通过 `http://host.docker.internal:11434` 访问宿主机 Ollama。可使用 `OLLAMA_BASE_URL` 和 `OLLAMA_MODEL` 环境变量修改服务地址和模型；请先确保 Ollama 已启动并安装对应模型。
