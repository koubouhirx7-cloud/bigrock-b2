import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_MICROCMS_API_KEY;
const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN;

async function check() {
  const res = await fetch(`https://${serviceDomain}.microcms.io/api/v1/products?limit=1`, {
    headers: { 'X-MICROCMS-API-KEY': apiKey }
  });
  const data = await res.json();
  const product = data.contents[0];
  console.log("Fetched product ID:", product.id);
  console.log("Variants:", product.variants);

  // attempt patch
  // this is just to see if the structure of PATCH matches what `create-order.js` does.
}
check();
