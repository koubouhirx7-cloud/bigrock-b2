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

    const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    if (!apiKey || !serviceDomain) {
        return res.status(500).json({ error: 'Server configuration error (Missing Credentials)' });
    }

    try {
        const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/orders?limit=100`, {
            headers: {
                'X-MICROCMS-API-KEY': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`MicroCMS responded with status: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
}
