import fetch from 'node-fetch';

const DOMAIN = 'bigrock-b2b-app';
const API_KEY = 'WrsmAEv3CAqxePhhaRjzqU0JEh2PZDsoNwoa';

async function check() {
  const url = `https://${DOMAIN}.microcms.io/api/v1/products?limit=100`;
  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': API_KEY }});
  const data = await res.json();
  const targets = data.contents.filter(p => p.title.includes('SKYLINE V2') || p.title.includes('ハンドルスペーサー'));
  console.log(JSON.stringify(targets.map(p => ({
    id: p.id,
    sku: p.sku,
    skuproducts: p.skuproducts,
    title: p.title,
    variants: p.variants
  })), null, 2));
}

check();
