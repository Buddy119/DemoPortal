import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const server = createServer(async (req, res) => {
  let filePath;
  if (req.url.startsWith('/src/')) {
    filePath = join('src', req.url.slice('/src/'.length));
  } else {
    filePath = join('public', req.url === '/' ? 'index.html' : req.url);
  }
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.jsx': 'text/jsx',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
