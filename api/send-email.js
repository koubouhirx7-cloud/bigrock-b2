import { verifyToken } from './utils/verify-token.js';
import nodemailer from 'nodemailer';

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

    const smtpHost = (process.env.SMTP_HOST || '').replace(/^"|"$/g, '').trim();
    const smtpPort = (process.env.SMTP_PORT || '').replace(/^"|"$/g, '').trim() || '465';
    const smtpUser = (process.env.SMTP_USER || '').replace(/^"|"$/g, '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').replace(/^"|"$/g, '').trim();
    const adminEmail = (process.env.VITE_ADMIN_EMAIL || '').replace(/^"|"$/g, '').trim() || "notifications@example.com";
    
    if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(500).json({ error: 'SMTP configuration is missing in environment variables. Please check Vercel settings.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort, 10),
            secure: parseInt(smtpPort, 10) === 465, 
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        const mailOptions = {
            from: `"BIGROCK B2B" <${smtpUser}>`, 
            to: to,
            bcc: adminEmail, // Send to customer and BCC admin
            subject: subject,
            text: text
        };

        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Email sending failed:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
