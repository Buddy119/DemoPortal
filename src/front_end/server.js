import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { transformAsync } from '@babel/core';

const server = createServer(async (req, res) => {
  let filePath;
  if (req.url.startsWith('/src/')) {
    filePath = join('src', req.url.slice('/src/'.length));
  } else {
    filePath = join('public', req.url === '/' ? 'index.html' : req.url);
  }
  try {
    const ext = extname(filePath);
    let data = await readFile(filePath, 'utf8');
    if (ext === '.jsx') {
      const result = await transformAsync(data, {
        presets: ['@babel/preset-react'],
        filename: filePath,
      });
      data = result.code;
    }
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.jsx': 'text/javascript',
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
