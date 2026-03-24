export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { password } = req.body;
  
  // Try to use environment variable, fallback to default if not set (for local dev safety)
  const adminPassword = process.env.ADMIN_PASSWORD || 'bigrock2026';

  if (password === adminPassword) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
}
