const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { join, extname } = require('path');

const PORT = process.argv[2] || 3000;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.ico':'image/x-icon','.png':'image/png','.json':'application/json' };

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!existsSync(file)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
