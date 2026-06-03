// POST /api/discord-notify
// SECURITY: Protects against SSRF and XSS attacks
// body: { type, title, fields }
// type: 'bm_created' | 'bm_resolved' | 'pm_completed'

import { sanitizeText, validateDiscordEmbedTitle, validateDiscordFields } from '../../lib/discord/sanitizer';
import { sanitizeWebhookUrl } from '../../lib/discord/ssrf-validator';

export default async function handler(req, res) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') return res.status(405).end();

  // Validate and sanitize webhook URL (SSRF protection)
  const webhookUrl = sanitizeWebhookUrl(process.env.DISCORD_WEBHOOK_URL);
  if (!webhookUrl) return res.status(200).json({ skipped: true }); // silently skip if not configured

  const { type, title, fields = [] } = req.body;

  // Validate type (whitelist approach)
  const validTypes = ['bm_created', 'bm_resolved', 'pm_completed'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid notification type' });
  }

  const colorMap = {
    bm_created:   0xef4444, // red
    bm_resolved:  0x22c55e, // green
    pm_completed: 0x3b82f6, // blue
  };

  const labelMap = {
    bm_created:   '🔴 BM 고장 신고',
    bm_resolved:  '✅ BM 수리 완료',
    pm_completed: '🔵 PM 완료',
  };

  try {
    // Sanitize inputs (XSS protection)
    const sanitizedTitle = validateDiscordEmbedTitle(String(title ?? 'Notification'));
    const sanitizedFields = validateDiscordFields(fields);

    const payload = {
      embeds: [{
        title: `${labelMap[type]}: ${sanitizedTitle}`,
        color: colorMap[type],
        fields: sanitizedFields.map(f => ({ name: f.name, value: f.value, inline: true })),
        footer: { text: 'DSC FMS Portal · Mannur Plant' },
        timestamp: new Date().toISOString(),
      }],
    };

    const r = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!r.ok) throw new Error(`Discord error: ${r.status}`);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[discord-notify]', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
