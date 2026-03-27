import { readFileSync } from 'fs';
import { join } from 'path';
import { fetchAllData } from './_lib/data.js';

export default async function handler(req, res) {
  try {
    const data = await fetchAllData();
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
    const script = `<script>window.__INITIAL__=${JSON.stringify(data)}</script>`;
    const out = html.replace('</head>', script + '\n</head>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).send(out);
  } catch (e) {
    res.status(500).send('Server error');
  }
}
