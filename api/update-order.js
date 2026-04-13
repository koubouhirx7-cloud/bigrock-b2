import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
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

    const { id, status, shippingInfo } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
    }

    const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
    const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

    if (!apiKey || !serviceDomain) {
        return res.status(500).json({ error: 'Server configuration error (Missing Credentials)' });
    }

    const isAdmin = userEmail === ADMIN_EMAIL;

    if (!isAdmin) {
        // IDOR Protection: Verify ownership
        try {
            const checkRes = await fetch(`https://${serviceDomain}.microcms.io/api/v1/orders/${id}`, {
                headers: { 'X-MICROCMS-API-KEY': apiKey }
            });
            if (!checkRes.ok) throw new Error("Target order not found");
            
            const targetOrder = await checkRes.json();
            if (targetOrder.customerEmail !== userEmail) {
                return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this order.' });
            }
        } catch (e) {
            return res.status(500).json({ error: 'Failed to verify order ownership', details: e.message });
        }
    }

    try {
        const payload = {
            ...(status && { status }),
            ...(shippingInfo !== undefined && { shippingInfo }) // allow clearing it
        };

        const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/orders/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-MICROCMS-API-KEY': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MicroCMS responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({ error: 'Failed to update order', details: error.message });
    }
}
