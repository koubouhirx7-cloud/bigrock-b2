import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await verifyToken(req);
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }

    const API_KEY = process.env.MICROCMS_API_KEY;
    const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;

    if (!API_KEY || !SERVICE_DOMAIN) {
        return res.status(500).json({ error: 'Server configuration missing' });
    }

    try {
        const response = await fetch(`https://${SERVICE_DOMAIN}.microcms.io/api/v1/customers?limit=100`, {
            headers: {
                'X-MICROCMS-API-KEY': API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`MicroCMS responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error proxying to MicroCMS:", error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
}
