import fetch from 'node-fetch';

const DOMAIN = 'bigrock-b2b-app';
const API_KEY = 'WrsmAEv3CAqxePhhaRjzqU0JEh2PZDsoNwoa';

async function check() {
  const url = `https://${DOMAIN}.microcms.io/api/v1/orders?limit=10`;
  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': API_KEY }});
  const data = await res.json();
  const drafts = data.contents.filter(o => o.status === '下書き' && o.items);
  drafts.slice(0, 2).forEach(draft => {
      console.log('Draft ID:', draft.id);
      const items = JSON.parse(draft.items || '[]');
      items.forEach(item => {
          console.log(`- Item Name: ${item.productName || item.name}, variantId: ${item.variantId}, isBO: ${item.isBO}`);
      });
  });
}

check();
