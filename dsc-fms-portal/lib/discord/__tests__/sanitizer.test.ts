// Security tests for XSS sanitizer

import { sanitizeText, validateDiscordField, validateDiscordEmbedTitle, validateDiscordFields } from '../sanitizer';

describe('XSS Sanitizer - Discord Content', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello';
      const result = sanitizeText(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const result = sanitizeText(malicious);
      expect(result).not.toContain('onerror');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });

    it('should limit length to 4096 characters', () => {
      const longText = 'A'.repeat(5000);
      const result = sanitizeText(longText);
      expect(result.length).toBeLessThanOrEqual(4096);
    });

    it('should remove control characters', () => {
      const text = 'Hello\x00World\x1fTest';
      const result = sanitizeText(text);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x1f');
    });
  });

  describe('validateDiscordField', () => {
    it('should sanitize field name and value', () => {
      const field = { name: '<script>Attack</script>', value: '123' };
      const result = validateDiscordField(field.name, field.value);
      expect(result.name).not.toContain('<script>');
      expect(result.value).toBe('123');
    });

    it('should limit field name to 256 characters', () => {
      const longName = 'A'.repeat(300);
      const result = validateDiscordField(longName, 'value');
      expect(result.name.length).toBeLessThanOrEqual(256);
    });

    it('should limit field value to 1024 characters', () => {
      const longValue = 'A'.repeat(1100);
      const result = validateDiscordField('name', longValue);
      expect(result.value.length).toBeLessThanOrEqual(1024);
    });
  });

  describe('validateDiscordEmbedTitle', () => {
    it('should sanitize embed title', () => {
      const malicious = '<img src=x onerror=alert(1)>Important Alert';
      const result = validateDiscordEmbedTitle(malicious);
      expect(result).not.toContain('onerror');
      expect(result).toContain('Important Alert');
    });

    it('should limit title to 256 characters', () => {
      const longTitle = 'A'.repeat(300);
      const result = validateDiscordEmbedTitle(longTitle);
      expect(result.length).toBeLessThanOrEqual(256);
    });
  });

  describe('validateDiscordFields', () => {
    it('should validate array of fields', () => {
      const fields = [
        { name: 'Field1', value: 'Value1' },
        { name: 'Field2', value: 'Value2' },
      ];
      const result = validateDiscordFields(fields);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('value');
    });

    it('should limit to 25 fields (Discord limit)', () => {
      const fields = Array(30).fill({ name: 'test', value: 'test' });
      const result = validateDiscordFields(fields);
      expect(result.length).toBeLessThanOrEqual(25);
    });

    it('should sanitize each field', () => {
      const fields = [
        { name: '<script>test</script>', value: '<img onerror=alert(1)>' },
      ];
      const result = validateDiscordFields(fields);
      expect(result[0].name).not.toContain('<script>');
      expect(result[0].value).not.toContain('onerror');
    });

    it('should handle non-array input', () => {
      const result = validateDiscordFields(null as any);
      expect(result).toEqual([]);
    });

    it('should handle malformed fields', () => {
      const fields = [
        { name: 'valid', value: 'value' },
        { invalid: 'field' },
      ];
      const result = validateDiscordFields(fields as any);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
    });
  });
});
