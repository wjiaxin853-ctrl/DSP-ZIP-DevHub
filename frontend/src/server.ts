const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/main.js': ['main.js', 'text/javascript; charset=utf-8'],
  '/extra.js': ['extra.js', 'text/javascript; charset=utf-8'],
  '/extra.css': ['extra.css', 'text/css; charset=utf-8'],
};

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';
const model = process.env.OLLAMA_MODEL || 'qwen3:0.6b';
const maxBodyBytes = 64 * 1024;

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function chat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: '仅支持 POST 请求。' });
  }
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return json(res, 415, { error: '请求必须使用 JSON 格式。' });
  }
  // Browser requests are same-origin; reject other origins before using the local model.
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) {
        return json(res, 403, { error: '不允许跨站请求。' });
      }
    } catch {
      return json(res, 403, { error: '请求来源无效。' });
    }
  }
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) return json(res, 413, { error: '请求内容过长。' });
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); 
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20 ||
      !body.messages.every(m => m && ['user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string' && m.content.trim().length > 0 && m.content.length <= 4000) ||
      body.messages[body.messages.length - 1].role !== 'user') {
      return json(res, 400, { error: '请输入有效的问题，对话最多支持 20 条消息。' });
    }
    const upstream = await fetch(new URL('/api/chat', ollamaBaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: '你是研发助手，请使用简体中文回答用户的问题。' }, ...body.messages], stream: false, think: false }),
      signal: AbortSignal.timeout(120000),
    });
    if (!upstream.ok) {
      console.error('Ollama returned HTTP', upstream.status);
      return json(res, 502, { error: '模型服务返回错误，请确认模型已安装且 Ollama 正常运行。' });
    }
    const result = await upstream.json();
    if (typeof result.message?.content !== 'string' || !result.message.content.trim()) {
      return json(res, 502, { error: '模型没有返回内容，请重试。' });
    }
    return json(res, 200, { message: result.message.content });
  } catch (error) {
    if (error instanceof SyntaxError) return json(res, 400, { error: '请求 JSON 格式无效。' });
    console.error('Ollama request failed:', error.message);
    return json(res, error.name === 'TimeoutError' ? 504 : 502, { error: error.name === 'TimeoutError' ? '模型响应超时，请重试。' : '无法连接本地模型，请检查 Ollama 服务。' });
  }
}

http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/chat') return void chat(req, res);
  const file = files[pathname];
  if (!file || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': file[1] });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(path.join(__dirname, file[0])).pipe(res);
}).listen(8080, '0.0.0.0', () => console.log('DSP DevHub listening on port 8080'));
