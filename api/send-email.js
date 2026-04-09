import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await verifyToken(req);
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }

    const { to, subject, text } = req.body;
    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.VITE_ADMIN_EMAIL || "notifications@example.com";
    
    if (!resendApiKey) {
        return res.status(500).json({ error: 'RESEND_API_KEY is not configured in environment variables. Please configure it in Vercel.' });
    }

    try {
        const payload = {
            // NOTE: Replace 'onboarding@resend.dev' with your verified domain email if necessary
            // E.g., 'BIGROCK B2B <info@your-verified-domain.com>'
            // Or use onboarding@resend.dev for testing (only to registered email)
            from: 'BIGROCK B2B <onboarding@resend.dev>', 
            to: [to, adminEmail], // Send to customer and BCC admin
            subject: subject,
            text: text
        };

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Resend API error: ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Email sending failed:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
