// api/utils/freee-token.js
// Utility to handle freee tokens securely and save/update them in MicroCMS

export async function getMicroCMSSystemSettings() {
    const API_KEY = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const DOMAIN = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    const response = await fetch(`https://${DOMAIN}.microcms.io/api/v1/system_settings?limit=1`, {
        headers: {
            'X-MICROCMS-API-KEY': API_KEY
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch system settings from MicroCMS: ' + response.statusText);
    }

    const data = await response.json();
    return data.contents.length > 0 ? data.contents[0] : null;
}

export async function saveFreeeTokens(accessToken, refreshToken, expiresIn, companyId = null) {
    const API_KEY = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const DOMAIN = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    // Calculate expiry timestamp (in seconds)
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const payload = {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt.toString()
    };

    if (companyId) {
        payload.freeeCompanyId = companyId.toString();
    }

    const currentSettings = await getMicroCMSSystemSettings();

    let endpoint = `https://${DOMAIN}.microcms.io/api/v1/system_settings`;
    let method = 'POST';

    // If an entry already exists, update it instead of creating a new one
    if (currentSettings && currentSettings.id) {
        endpoint = `https://${DOMAIN}.microcms.io/api/v1/system_settings/${currentSettings.id}`;
        method = 'PATCH';
    }

    const response = await fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-MICROCMS-API-KEY': API_KEY
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error('Failed to save freee tokens to MicroCMS: ' + err);
    }

    return await response.json();
}

export async function getValidFreeeToken() {
    const settings = await getMicroCMSSystemSettings();
    if (!settings || !settings.accessToken) {
        throw new Error('FREEE_NOT_CONNECTED');
    }

    const now = Math.floor(Date.now() / 1000);
    // Add a 5 minute buffer for token expiration
    if (parseInt(settings.expiresAt) < (now + 300)) {
        console.log("Freee token expired. Refreshing...");
        return await refreshFreeeToken(settings.refreshToken, settings.freeeCompanyId);
    }

    return {
        accessToken: settings.accessToken,
        companyId: settings.freeeCompanyId
    };
}

async function refreshFreeeToken(refreshToken, companyId) {
    const clientId = process.env.FREEE_CLIENT_ID;
    const clientSecret = process.env.FREEE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('FREEE_CREDENTIALS_MISSING');
    }

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
    });

    const response = await fetch('https://accounts.secure.freee.co.jp/public_api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error('FREEE_REFRESH_FAILED: ' + JSON.stringify(errorData));
    }

    const data = await response.json();
    await saveFreeeTokens(data.access_token, data.refresh_token, data.expires_in, companyId);
    
    return {
        accessToken: data.access_token,
        companyId: companyId
    };
}
