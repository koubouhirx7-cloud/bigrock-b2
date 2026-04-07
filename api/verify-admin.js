// In-memory brute force protection
// Tracks failed attempts per IP: { ip: { count, lockedUntil } }
const failedAttempts = {};
const MAX_ATTEMPTS = 5;       // lockout after 5 consecutive failures
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  // Check if this IP is currently locked out
  if (failedAttempts[ip]) {
    const record = failedAttempts[ip];
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    } else if (record.lockedUntil && now >= record.lockedUntil) {
      // Lockout expired, reset
      delete failedAttempts[ip];
    }
  }

  const { password } = req.body;

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not configured.");
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  if (password === adminPassword) {
    // Success - clear any previous failed attempts for this IP
    delete failedAttempts[ip];
    return res.status(200).json({ success: true });
  } else {
    // Track failed attempt
    if (!failedAttempts[ip]) {
      failedAttempts[ip] = { count: 0, lockedUntil: null };
    }
    failedAttempts[ip].count += 1;

    if (failedAttempts[ip].count >= MAX_ATTEMPTS) {
      failedAttempts[ip].lockedUntil = now + LOCKOUT_MS;
      console.warn(`Admin login locked for IP: ${ip} after ${MAX_ATTEMPTS} failed attempts.`);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Access locked for 15 minutes.'
      });
    }

    const remaining = MAX_ATTEMPTS - failedAttempts[ip].count;
    return res.status(401).json({
      success: false,
      message: `Invalid password. ${remaining} attempt(s) remaining before lockout.`
    });
  }
}

