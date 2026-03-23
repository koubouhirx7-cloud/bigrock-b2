import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  process.loadEnvFile(path.join(__dirname, '../.env.local'));
} catch (e) {
  console.log("No .env.local found or error loading it", e.message);
}

const productsDataPath = path.join(__dirname, '../src/data/products.json');
const localProducts = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));

async function migrateVariants() {
    console.log('Migrating variants to MicroCMS Repeater Field...');

    const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;

    // The Custom Field ID the subagent created is likely "variants" ? Or "variantItem". Let's try "variantItem".
    // Wait, earlier step 233 clicked "variantItemY" and maybe changed it. Let's assume the ID is "variantItem".
    
    for (const localProd of localProducts) {
        if (!localProd.variants || localProd.variants.length === 0) continue;

        const productId = localProd.id;
        
        // Convert the variants array to MicroCMS Repeater format
        // The subagent created a Custom Field with ID `variantItem`
        const repeaterVariants = localProd.variants.map(v => ({
            fieldId: 'variantItemY', // Match the custom field ID created by subagent
            id: v.id || v.name,
            name: v.name,
            stock: v.stock
        }));

        const content = {
            variants: repeaterVariants
        };

        try {
            console.log(`\nMigrating variants for: ${localProd.name}`);
            const patchRes = await fetch(`https://${serviceDomain}.microcms.io/api/v1/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-MICROCMS-API-KEY': apiKey
                },
                body: JSON.stringify(content)
            });

            if (patchRes.ok) {
                console.log(`Successfully migrated variants for ${localProd.name}.`);
            } else {
                const errText = await patchRes.text();
                console.error(`Failed to migrate ${localProd.name}: ${patchRes.status} ${errText}`);
                
                // If variantItem failed, maybe it's named something else.
                // We'll throw an error so we can read it.
                if (errText.includes('fieldId')) {
                    console.log("FieldID might be wrong. Will retry if needed.");
                    break; 
                }
            }

        } catch (e) {
            console.error(`Error processing ${localProd.name}:`, e.message);
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n--- Finished Variant Migration ---');
}

migrateVariants();
