import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_DOMAIN = 'bigrock-b2b-app';
const API_KEY = 'WrsmAEv3CAqxePhhaRjzqU0JEh2PZDsoNwoa';
const API_URL = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/products`;

const productsDataPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));

async function seedData() {
    console.log(`Starting to seed ${products.length} products to MicroCMS...`);

    for (const product of products) {
        const payload = {
            title: product.name,
            sku: product.id,
            category: [product.category], // If it's a select field, array might be needed, or just string if text field. The subagent used Text Field for category. Let's pass string.
        };

        // Adjust category based on text field schema created by subagent
        payload.category = product.category;
        payload.basePrice = product.price;
        payload.stock = product.stock !== undefined ? product.stock : 100;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-MICROCMS-API-KEY': API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Failed to post ${product.name}: ${response.status} ${errText}`);
            } else {
                console.log(`Successfully uploaded: ${product.name}`);
            }
        } catch (e) {
            console.error(`Error uploading ${product.name}:`, e.message);
        }
    }
    console.log('Finished seeding data.');
}

seedData();
