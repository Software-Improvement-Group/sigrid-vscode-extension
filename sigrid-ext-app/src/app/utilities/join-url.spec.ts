import { joinUrl } from './join-url';

describe('utilities/join-url', () => {
  it('joins a base url with multiple path segments', () => {
    expect(joinUrl('https://example.com', 'a', 'b', 'c')).toBe('https://example.com/a/b/c');
  });

  it('works when base url already ends with a slash', () => {
    expect(joinUrl('https://example.com/', 'a', 'b')).toBe('https://example.com/a/b');
  });

  it('keeps the base pathname when the base url contains one', () => {
    expect(joinUrl('https://example.com/api/', 'v1', 'items')).toBe(
      'https://example.com/api/v1/items'
    );
  });

  it('normalizes extra slashes coming from segments (URL will resolve them)', () => {
    expect(joinUrl('https://example.com/', '/a/', '/b/', 'c/')).toBe('https://example.com/a//b//c/');
  });

  it('encodes characters that require encoding via URL resolution', () => {
    expect(joinUrl('https://example.com', 'a b')).toBe('https://example.com/a%20b');
  });
});
