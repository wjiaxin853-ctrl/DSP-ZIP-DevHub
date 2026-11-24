# DSP DevHub 初代交互原型

静态页面与交互源码位于 `src/`，使用 TypeScript 编译。当前数据均为模拟数据，上传、下载、智能问答与自动任务尚未接入后端。

```bash
npm ci
npm run build
npm start
```

访问 <http://localhost:8080/>。修改 TypeScript 后重新运行 `npm run build`。目前迁移版仅进行 TypeScript 编译，原有交互代码的严格类型检查尚待逐步完善。

容器运行：

```bash
docker build -t dsp-devhub-frontend .
docker run -d --name dsp-devhub-frontend -p 18080:8080 dsp-devhub-frontend
```

访问 <http://localhost:18080/>。
