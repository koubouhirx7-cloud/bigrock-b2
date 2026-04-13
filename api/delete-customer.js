import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let decodedToken;
    try {
        decodedToken = await verifyToken(req);
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }

    const userEmail = decodedToken?.email;
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized: No email found in token.' });
    }

    const API_KEY = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const SERVICE_DOMAIN = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
    const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

    if (!API_KEY || !SERVICE_DOMAIN) {
        return res.status(500).json({ error: 'Server configuration missing' });
    }

    const { id } = req.query; // Wait, req.query logic? No, req.query is correct for DELETE usually if it's sent as query string.

    if (!id) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    const isAdmin = userEmail === ADMIN_EMAIL;

    if (!isAdmin) {
        // IDOR Protection: Verify ownership
        try {
            const checkRes = await fetch(`https://${SERVICE_DOMAIN}.microcms.io/api/v1/customers/${id}`, {
                headers: { 'X-MICROCMS-API-KEY': API_KEY }
            });
            if (!checkRes.ok) throw new Error("Target customer not found");
            
            const targetCustomer = await checkRes.json();
            if (targetCustomer.email !== userEmail) {
                return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this record.' });
            }
        } catch (e) {
            return res.status(500).json({ error: 'Failed to verify customer ownership', details: e.message });
        }
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
