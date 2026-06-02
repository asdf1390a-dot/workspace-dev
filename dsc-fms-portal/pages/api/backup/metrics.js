export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      dailyBackupCount: 12,
      storageUsageGb: 45.6,
      lastBackupTime: new Date().toISOString(),
    });
  }

  res.setHeader('Allow', 'GET');
  return res.status(405).json({ error: 'method_not_allowed' });
}
