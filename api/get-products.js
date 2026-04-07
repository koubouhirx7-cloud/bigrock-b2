import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        await verifyToken(req);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }

    const API_KEY = process.env.MICROCMS_API_KEY;
    const DOMAIN = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    if (!API_KEY || !DOMAIN) {
        return res.status(500).json({ message: 'Server configuration error: Missing MicroCMS credentials' });
    }

    try {
        const response = await fetch(`https://${DOMAIN}.microcms.io/api/v1/products?limit=100`, {
            method: 'GET',
            headers: {
                'X-MICROCMS-API-KEY': API_KEY,
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`MicroCMS responded with ${response.status}: ${errorData}`);
        }

        const data = await response.json();

        // Return exactly what MicroCMS formats, the frontend `fetchProducts` expects { contents: [...] }
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        return res.status(200).json(data);
    } catch (error) {
        console.error("MicroCMS Proxy Error:", error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
