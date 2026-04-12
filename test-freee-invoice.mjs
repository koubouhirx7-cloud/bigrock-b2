import fs from 'fs';
import fetch from 'node-fetch'; // Vercel environment usually works or I can use global fetch if node > 18
import { getValidFreeeToken } from './api/utils/freee-token.js';

async function test() {
    const auth = await getValidFreeeToken();
    if (!auth) return console.log("No auth");
    
    // Attempt minimum invoice logic as in create-invoices.js
    const payload = {
        company_id: parseInt(auth.companyId),
        issue_date: "2026-04-09",
        partner_id: 1, // just needs a number, will fail if 1 doesn't exist but we want to see the error format. Let's just pass some data.
        invoice_contents: [
            {
                type: 'normal',
                qty: 1,
                unit: '個',
                unit_price: 1500,
                description: 'テスト',
                tax_entry_method: 'inclusive'
            }
        ]
    };

    const res = await fetch(`https://api.freee.co.jp/api/1/invoices`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("FREEE ERROR:", text);
}
test();
