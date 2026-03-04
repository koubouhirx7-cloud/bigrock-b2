export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // The secret API Key is read from Vercel's backend environment variables, NEVER from the browser
    const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    if (!apiKey || !serviceDomain) {
        return res.status(500).json({ error: 'Server configuration error (Missing MicroCMS Credentials)' });
    }

    try {
        const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-MICROCMS-API-KEY': apiKey
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MicroCMS responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
}
