import { describe, expect, it } from 'vitest';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';

describe('safeUrl helpers', () => {
  it('accepts http/https URLs', () => {
    expect(normalizeHttpUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
    expect(normalizeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('rejects unsafe protocols and invalid URLs', () => {
    expect(normalizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeHttpUrl('data:text/html,hello')).toBeNull();
    expect(normalizeHttpUrl('not-a-url')).toBeNull();
  });

  it('extracts safe filenames', () => {
    expect(extractFileNameFromUrl('https://cdn.example.com/a/b/report.pdf?x=1', 'fallback.pdf')).toBe('report.pdf');
    expect(extractFileNameFromUrl('javascript:alert(1)', 'fallback.pdf')).toBe('fallback.pdf');
  });
});
