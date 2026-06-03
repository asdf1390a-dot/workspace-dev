// SSRF (Server-Side Request Forgery) validator for Discord webhook URLs

const INTERNAL_IP_PATTERNS = [
  /^127\.0\.0\.1(:[0-9]+)?$/,
  /^localhost(:[0-9]+)?$/i,
  /^0\.0\.0\.0(:[0-9]+)?$/,
  /^10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?$/,
  /^172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?$/,
  /^192\.168\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?$/,
  /^[a-zA-Z0-9\-]+\.local(:[0-9]+)?$/i,
  /^::1(:[0-9]+)?$/,
  /^fe80:[0-9a-fA-F:]*$/,
];

const ALLOWED_DISCORD_HOSTS = [
  'discord.com',
  'discordapp.com',
  'cdn.discordapp.com',
];

export function validateDiscordWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS for webhooks
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Discord webhooks must use HTTPS' };
    }

    // Check against allowed Discord hosts
    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_DISCORD_HOSTS.some(host =>
      hostname === host || hostname.endsWith(`.${host}`)
    );

    if (!isAllowedHost) {
      return { valid: false, error: 'URL must be a Discord webhook URL' };
    }

    // Additional check: prevent internal IP addresses (defense in depth)
    for (const pattern of INTERNAL_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Internal IP addresses are not allowed' };
      }
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function sanitizeWebhookUrl(url: string | undefined): string | null {
  if (!url) return null;

  const validation = validateDiscordWebhookUrl(url);
  if (!validation.valid) {
    console.error('[SSRF Validation Failed]', validation.error, 'URL:', url);
    return null;
  }

  return url;
}
