import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDataPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));

// CSV Header matching MicroCMS schema IDs
const csvLines = ['title,sku,category,basePrice,stock'];

for (const product of products) {
    const safeName = product.name.replace(/"/g, '\"');
    const safeCategory = (product.category || '').replace(/"/g, '\"');
    csvLines.push(`"${safeName}","${product.id}","${safeCategory}",${product.price},${product.stock || 100}`);
}

fs.writeFileSync(path.join(__dirname, '../products-import.csv'), csvLines.join('\n'));
console.log('products-import.csv has been created in the project root.');
