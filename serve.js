const { createServer } = require('http');
const { readFileSync } = require('fs');
const { join, extname } = require('path');

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

createServer((req, res) => {
  const path = join(__dirname, req.url === '/' ? 'index.html' : req.url);
  try {
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
    res.end(readFileSync(path));
  } catch (err) {
    console.log('caught error lol');
    console.error(err);
  }
}).listen(3000, () => console.log('http://localhost:3000'));
