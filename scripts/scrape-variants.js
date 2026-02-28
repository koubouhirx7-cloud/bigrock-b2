import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDataPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));

async function scrapeVariants() {
    console.log('Starting to scrape variants for products...');

    const csvLines = ['title,sku,category,basePrice,stock,variants'];

    for (const product of products) {
        if (!product.originalUrl) {
            console.warn(`Skipping ${product.name} (no originalUrl)`);
            continue;
        }

        try {
            console.log(`Fetching ${product.originalUrl}...`);
            const res = await fetch(product.originalUrl);
            const html = await res.text();
            const $ = cheerio.load(html);

            const scrapedVariants = [];

            // 1. Extract Sizes/Weights from weight-table or geo-table
            $('table.weight-table tbody tr').each((i, el) => {
                const sizeStr = $(el).find('td').first().text().trim();
                if (sizeStr) {
                    scrapedVariants.push({
                        type: 'size',
                        name: sizeStr,
                        stock: 10 // default stock
                    });
                }
            });

            // 2. Extract Colors
            $('.content-block h3:contains("Color Variation")').parent().find('ul li').each((i, el) => {
                let colorStr = $(el).text().trim();
                colorStr = colorStr.replace(/^●\s*/, '').trim(); // Remove the list dot
                if (colorStr) {
                    scrapedVariants.push({
                        type: 'color',
                        name: colorStr,
                        stock: 10
                    });
                }
            });

            // If no tables or colors found, fallback to original variants in products.json
            let finalVariants = scrapedVariants.length > 0 ? scrapedVariants : product.variants;

            const safeName = product.name.replace(/"/g, '""');
            const safeCategory = (product.category || '').replace(/"/g, '""');
            const safeVariants = JSON.stringify(finalVariants || []).replace(/"/g, '""');

            csvLines.push(`"${safeName}","${product.id}","${safeCategory}",${product.price},${product.stock || 100},"${safeVariants}"`);

        } catch (e) {
            console.error(`Error scraping ${product.name}:`, e.message);
        }
    }

    const outputPath = path.join(__dirname, '../products-deep-import.csv');
    fs.writeFileSync(outputPath, csvLines.join('\n'));
    console.log(`Successfully generated ${outputPath}`);
}

scrapeVariants();
