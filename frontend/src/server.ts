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
http.createServer((req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': file[1] });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(path.join(__dirname, file[0])).pipe(res);
}).listen(8080, '0.0.0.0', () => console.log('DSP DevHub listening on port 8080'));
