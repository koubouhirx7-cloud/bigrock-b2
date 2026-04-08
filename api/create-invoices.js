import { verifyToken } from './utils/verify-token.js';
import { getValidFreeeToken } from './utils/freee-token.js';
import { getBillingCycleDates, calculateDueDate } from './utils/date-utils.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        await verifyToken(req);
    } catch (e) {
        return res.status(401).json({ message: 'Unauthorized execution' });
    }

    try {
        // 1. Get Freee token
        const freeeAuth = await getValidFreeeToken();
        if (!freeeAuth) {
            return res.status(400).json({ message: 'Freee is not connected.' });
        }

        const { accessToken, companyId } = freeeAuth;

        // 2. Calculate dates
        const { startDate, endDate } = getBillingCycleDates();
        const issueDate = endDate.toISOString().split('T')[0]; // yyyy-mm-dd
        const dueDate = calculateDueDate(endDate).toISOString().split('T')[0];

        // 3. Fetch Orders from MicroCMS
        const API_KEY = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
        const DOMAIN = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

        if (!API_KEY || !DOMAIN) {
            throw new Error('Server configuration error: Missing MicroCMS Credentials');
        }

        // Fetch up to 100 recent orders. MicroCMS max limit is 100, using 300 causes a 400 error.
        const ordersRes = await fetch(`https://${DOMAIN}.microcms.io/api/v1/orders?limit=100`, {
            headers: { 'X-MICROCMS-API-KEY': API_KEY }
        });

        if (!ordersRes.ok) {
            const errText = await ordersRes.text();
            throw new Error(`Failed to fetch orders from MicroCMS. Status: ${ordersRes.status}, Error: ${errText}`);
        }
        
        const ordersData = await ordersRes.json();
        const allOrders = ordersData.contents;

        // 4. Filter orders belonging to this billing cycle
        // Assuming order.orderDate is ISO string or default createdAt
        const validOrders = allOrders.filter(order => {
            const d = new Date(order.createdAt || order.orderDate);
            return d >= startDate && d <= endDate && order.status !== '取消'; // Adjust status check as needed
        });

        if (validOrders.length === 0) {
            return res.status(200).json({ success: true, message: "No orders found for this billing cycle.", results: [] });
        }

        // 5. Group by customer email
        const customerGroups = {};
        validOrders.forEach(order => {
            const email = order.customerEmail || order.email || 'unknown';
            if (!customerGroups[email]) {
                const cName = order.companyName || order.customerCompanyName; // support both just in case
                customerGroups[email] = {
                    companyName: cName ? cName : `お客様 (${email})`,
                    orders: []
                };
            }
            customerGroups[email].orders.push(order);
        });

        // 6. Generate Invoices
        const results = [];
        
        for (const [email, group] of Object.entries(customerGroups)) {
            try {
                // Step A: Find or Create Partner in Freee
                const partnersRes = await fetch(`https://api.freee.co.jp/api/1/partners?company_id=${companyId}&keyword=${encodeURIComponent(group.companyName)}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                
                let partnerId = null;
                if (partnersRes.ok) {
                    const pb = await partnersRes.json();
                    if (pb.partners && pb.partners.length > 0) {
                        partnerId = pb.partners[0].id;
                    }
                }

                // If not found, try creating it
                if (!partnerId) {
                    const cpRes = await fetch(`https://api.freee.co.jp/api/1/partners`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            company_id: parseInt(companyId),
                            name: group.companyName
                        })
                    });
                    if (cpRes.ok) {
                        const cpData = await cpRes.json();
                        partnerId = cpData.partner.id;
                    } else {
                        // fallback to a dummy or error
                        throw new Error(`Could not create partner for ${group.companyName}`);
                    }
                }

                // Step B: Map Order Items to Invoice Contents
                const invoiceContents = [];
                group.orders.forEach(order => {
                    // Usually an order has multiple items
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    items.forEach(item => {
                        invoiceContents.push({
                            type: 'normal',
                            qty: parseInt(item.quantity) || 1,
                            unit: '個',
                            unit_price: parseInt(item.price) || 0,
                            description: `${item.name} (注文番号: ${order.id})`,
                            tax_entry_method: 'inclusive'
                        });
                    });
                });

                // Step C: POST Invoice
                const invoicePayload = {
                    company_id: parseInt(companyId),
                    issue_date: issueDate,
                    due_date: dueDate,
                    partner_id: partnerId,
                    invoice_contents: invoiceContents
                };

                const invRes = await fetch(`https://api.freee.co.jp/api/1/invoices`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoicePayload)
                });

                if (!invRes.ok) {
                    const errObj = await invRes.text();
                    throw new Error(`Failed to create freee invoice: ${errObj}`);
                }

                results.push({ email, status: 'Success', company: group.companyName });
            } catch (err) {
                console.error(`Error processing ${email}:`, err);
                results.push({ email, status: 'Failed', error: err.message, company: group.companyName });
            }
        }

        return res.status(200).json({ success: true, results, billingPeriod: { start: startDate, end: endDate } });
    } catch (error) {
        console.error("Freee Integration Error:", error);
        return res.status(500).json({ message: error.message });
    }
}
