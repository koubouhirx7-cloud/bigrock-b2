import { saveFreeeTokens } from './utils/freee-token.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { code, error } = req.query;

    if (error) {
        return res.send(`<h2>Freee Authentication Failed</h2><p>${error}</p>`);
    }

    if (!code) {
        return res.status(400).send("No authorization code provided by freee.");
    }

    const clientId = process.env.FREEE_CLIENT_ID;
    const clientSecret = process.env.FREEE_CLIENT_SECRET;
    
    // Support local development redirect URI vs production redirect URI
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/freee-callback`;

    if (!clientId || !clientSecret) {
        return res.status(500).send("Server configuration missing: Freee API Credentials not found.");
    }

    try {
        // 1. Exchange the authorization code for an access token
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri
        });

        const tokenResponse = await fetch('https://accounts.secure.freee.co.jp/public_api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        if (!tokenResponse.ok) {
            const errData = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${errData}`);
        }

        const tokenData = await tokenResponse.json();

        // 2. Fetch the user's freee companies to get the default company_id
        const userResponse = await fetch('https://api.freee.co.jp/api/1/users/me?companies=true', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        let companyId = null;
        if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user && userData.user.companies && userData.user.companies.length > 0) {
                // Usually take the first company they belong to
                companyId = userData.user.companies[0].id;
            }
        }

        // 3. Save to microCMS
        await saveFreeeTokens(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in, companyId);

        // 4. Redirect the user back to the admin dashboard with a success parameter
        // Assuming the admin dashboard is running on the frontend root
        res.redirect('/?tab=admin&freeeSuccess=true');

    } catch (err) {
        console.error("Freee Authentication Error:", err);
        res.status(500).send(`<h2>Internal Server Error during Freee Auth</h2><p>${err.message}</p>`);
    }
}
