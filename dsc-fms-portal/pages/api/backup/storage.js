export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      usedGb: 45.6,
      quotaGb: 100,
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      return res.status(200).json({ success: true, quotaGb: body.quotaGb });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method_not_allowed' });
}
