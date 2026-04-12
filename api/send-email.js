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

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const adminEmail = process.env.VITE_ADMIN_EMAIL || "notifications@example.com";
    
    if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(500).json({ error: 'SMTP configuration is missing in environment variables. Please check Vercel settings.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || '465', 10),
            secure: parseInt(smtpPort || '465', 10) === 465, 
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        const mailOptions = {
            from: `BIGROCK B2B <${smtpUser}>`, 
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
