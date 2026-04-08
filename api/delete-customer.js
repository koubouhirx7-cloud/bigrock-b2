import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await verifyToken(req);
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }

    const API_KEY = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const SERVICE_DOMAIN = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    if (!API_KEY || !SERVICE_DOMAIN) {
        return res.status(500).json({ error: 'Server configuration missing' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    try {
        const response = await fetch(`https://${SERVICE_DOMAIN}.microcms.io/api/v1/customers/${id}`, {
            method: 'DELETE',
            headers: {
                'X-MICROCMS-API-KEY': API_KEY,
            }
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            return res.status(response.status).json(errorBody);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error proxying to MicroCMS:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
