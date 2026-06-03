// Security tests for SSRF validator

import { validateDiscordWebhookUrl, sanitizeWebhookUrl } from '../ssrf-validator';

describe('SSRF Validator - Discord Webhook URLs', () => {
  describe('validateDiscordWebhookUrl', () => {
    it('should accept valid Discord webhook URLs', () => {
      const validUrls = [
        'https://discord.com/api/webhooks/123456/abcdef',
        'https://discordapp.com/api/webhooks/987654/xyz',
      ];

      validUrls.forEach(url => {
        const result = validateDiscordWebhookUrl(url);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject HTTP (non-HTTPS) URLs', () => {
      const result = validateDiscordWebhookUrl('http://discord.com/api/webhooks/123/abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTPS');
    });

    it('should reject internal IP addresses', () => {
      const internalIps = [
        'https://127.0.0.1:8080/webhook',
        'https://localhost/webhook',
        'https://192.168.1.1/webhook',
        'https://10.0.0.1/webhook',
        'https://172.16.0.1/webhook',
      ];

      internalIps.forEach(url => {
        const result = validateDiscordWebhookUrl(url);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('not allowed');
      });
    });

    it('should reject non-Discord URLs', () => {
      const result = validateDiscordWebhookUrl('https://attacker.com/webhook');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Discord webhook');
    });

    it('should handle invalid URL formats', () => {
      const result = validateDiscordWebhookUrl('not a url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('sanitizeWebhookUrl', () => {
    it('should return valid URL as-is', () => {
      const url = 'https://discord.com/api/webhooks/123/abc';
      const result = sanitizeWebhookUrl(url);
      expect(result).toBe(url);
    });

    it('should return null for invalid URL', () => {
      const result = sanitizeWebhookUrl('https://attacker.com/hook');
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = sanitizeWebhookUrl(undefined);
      expect(result).toBeNull();
    });
  });
});
