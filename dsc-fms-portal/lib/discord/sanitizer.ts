// HTML/XSS sanitizer for Discord message content

import DOMPurify from 'isomorphic-dompurify';

// DOMPurify config for Discord embeds (strip all HTML, only allow text)
const DISCORD_PURIFY_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';

  // Remove any HTML/script tags
  const cleaned = DOMPurify.sanitize(text, DISCORD_PURIFY_CONFIG);

  // Remove markdown-based XSS: [text](javascript:...), [text](data:...), etc.
  // Discord interprets markdown links, so we must remove them entirely
  let result = cleaned;

  // Remove markdown link patterns [text](url)
  // Pattern matches nested parens within a single link: [text](url(nested)) but not across links
  result = result.replace(/\[[^\]]*\]\s*\((?:[^()]|\([^)]*\))*\)/g, '');

  // Remove any dangerous protocol schemes even if not in markdown context
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    const escapedProtocol = protocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedProtocol, 'gi'), '');
  }

  // Additional safety: limit length and remove control characters
  return result
    .substring(0, 4096) // Discord field limit
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

export function sanitizeDiscordField(name: string, value: any): { name: string; value: string } {
  return {
    name: sanitizeText(name).substring(0, 256), // Discord field name limit
    value: sanitizeText(String(value ?? '-')).substring(0, 1024), // Discord field value limit
  };
}

export function validateDiscordEmbedTitle(title: string): string {
  // Discord embed title limit is 256 characters
  const sanitized = sanitizeText(title);
  return sanitized.substring(0, 256);
}

// Validate array of fields before processing
export function validateDiscordFields(fields: any[]): Array<{ name: string; value: string }> {
  if (!Array.isArray(fields)) {
    return [];
  }

  return fields
    .slice(0, 25) // Discord embed field limit
    .map(f => {
      if (typeof f === 'object' && f !== null && 'name' in f) {
        return sanitizeDiscordField(f.name, f.value);
      }
      return { name: 'Field', value: 'Invalid' };
    });
}
