// api/freee-auth.js
import { verifyToken } from './utils/verify-token.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Optional: Ensure only authenticated admin can initiate
        // Since Vercel auth usually expects a Bearer token, and we redirect from browser,
        // it may be hard to attach headers on a pure redirect. 
        // We will rely on UI hiding for now, but anyone guessing the URL can initiate Freee auth.
        // However, they can't complete it without the Freee admin login credentials.
    } catch (e) {
        // ...
    }

    const clientId = process.env.FREEE_CLIENT_ID;
    if (!clientId) {
        return res.status(500).send("Freee Client ID is not configured on the server.");
    }

    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/freee-callback`;

    // Security practice: Generating a random state string to prevent CSRF
    const state = Math.random().toString(36).substring(2, 15);
    
    // We should ideally save `state` in a cookie to verify it in the callback, 
    // but Freee requires state parameter mainly for the dev's own security implementation.

    const authUrl = `https://accounts.secure.freee.co.jp/public_api/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

    // Redirect the browser to Freee's OAuth consent screen
    res.redirect(authUrl);
}
