import admin from 'firebase-admin';

// Initialize Firebase Admin just with projectId to allow token verification
if (!admin.apps.length) {
    // Vercel handles VITE_ prefixed variables during build, but in serverless we should check both
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (projectId) {
        admin.initializeApp({ projectId });
    } else {
        // Fallback or warning if missing. Token verification might fail without projectId.
        console.warn("WARNING: Firebase Project ID is not set in environment.");
        admin.initializeApp();
    }
}

/**
 * Validates the Authorization Bearer token from the request.
 * Returns the decoded token if valid. Throws error if invalid.
 * @param {Request} req The incoming HTTP request
 * @returns {Promise<Object>} Decoded Firebase user payload
 */
export async function verifyToken(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid Authorization header format');
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error("Token verification error:", error);
        throw new Error('Unauthorized: Invalid or expired token');
    }
}
