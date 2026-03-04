import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables for microcms client
try {
    process.loadEnvFile(path.join(__dirname, '../.env.local'));
} catch (e) {
    console.log("No .env.local found or error loading it", e.message);
}

const productsDataPath = path.join(__dirname, '../src/data/products.json');
const localProducts = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));

async function updateProductImages() {
    console.log('Starting automated product image scraping and MicroCMS import...');

    const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;

    if (!serviceDomain || !apiKey) {
        console.error("Missing MicroCMS credentials in environment variables.");
        return;
    }

    for (const localProd of localProducts) {
        if (!localProd.originalUrl) continue;

        try {
            console.log(`\nProcessing: ${localProd.name}`);
            const res = await fetch(localProd.originalUrl);
            const html = await res.text();
            const $ = cheerio.load(html);

            let imageUrl = $('div#heroSlider .slides .slide img').first().attr('src');
            if (!imageUrl) {
                imageUrl = $('.proinfo_images img').first().attr('src') || $('img.main-image').attr('src');
            }

            if (imageUrl) {
                if (imageUrl.startsWith('/')) {
                    imageUrl = `https://www.bigrock-bike.jp${imageUrl}`;
                } else if (!imageUrl.startsWith('http')) {
                    imageUrl = `https://www.bigrock-bike.jp/${imageUrl}`;
                }
                console.log(`Image found: ${imageUrl}`);
            }

            // Sync full product to MicroCMS
            // We use the local product ID as the MicroCMS contentId
            const productId = localProd.id;
            const content = {
                title: localProd.name,
                category: localProd.category,
                skuproducts: localProd.sku,
                basePrice: localProd.price,
                stock: localProd.stock,
                externalImageUrl: imageUrl || '',
                variants: JSON.stringify(localProd.variants || [])
            };

            const postRes = await fetch(`https://${serviceDomain}.microcms.io/api/v1/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-MICROCMS-API-KEY': apiKey
                },
                body: JSON.stringify(content)
            });

            if (postRes.ok) {
                console.log(`Successfully created ${localProd.name} via POST.`);
            } else {
                const errText = await postRes.text();
                console.error(`Failed to create ${localProd.name}: ${postRes.status} ${errText}`);
            }

        } catch (e) {
            console.error(`Error processing ${localProd.name}:`, e.message);
        }

        // Sleep to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n--- Finished Image Update ---');
}

updateProductImages();
