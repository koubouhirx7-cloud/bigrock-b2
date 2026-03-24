export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, updates } = req.body;

  if (!id || !updates) {
    return res.status(400).json({ message: 'Missing product id or updates' });
  }

  try {
    const response = await fetch(`https://${process.env.VITE_MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-MICROCMS-API-KEY': process.env.VITE_MICROCMS_API_KEY
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`MicroCMS Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Update Product API Error:', error);
    return res.status(500).json({ message: error.message });
  }
}
