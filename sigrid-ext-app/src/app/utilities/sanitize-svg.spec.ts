import {describe, expect, it} from 'vitest';
import {sanitizeSvg} from './sanitize-svg';

describe('sanitizeSvg', () => {
  it('leaves benign SVG markup untouched', () => {
    const svgContent = '<svg><path d="M1 2" fill="red"></path></svg>';

    expect(sanitizeSvg(svgContent)).toBe('<svg><path d="M1 2" fill="red"/></svg>');
  });

  it('strips script elements', () => {
    const svgContent = '<svg><script>alert(1)</script><path d="M1 2"></path></svg>';

    const result = sanitizeSvg(svgContent);

    expect(result).not.toContain('script');
    expect(result).toContain('<path d="M1 2"/>');
  });

  it('strips event handler attributes', () => {
    const svgContent = '<svg><circle cx="1" cy="2" r="3" onclick="alert(1)" onmouseover="alert(2)"></circle></svg>';

    const result = sanitizeSvg(svgContent);

    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('cx="1"');
  });

  it('strips javascript: hrefs', () => {
    const svgContent = '<svg><a href="javascript:alert(1)"><path d="M1 2"></path></a></svg>';

    const result = sanitizeSvg(svgContent);

    expect(result).not.toContain('javascript:');
  });

  it('strips data:text/html hrefs', () => {
    const svgContent = '<svg><a href="data:text/html,<script>alert(1)</script>"><path d="M1 2"></path></a></svg>';

    const result = sanitizeSvg(svgContent);

    expect(result).not.toContain('data:text/html');
  });

  it('strips foreignObject elements', () => {
    const svgContent = '<svg><foreignObject><div onclick="alert(1)">hi</div></foreignObject></svg>';

    const result = sanitizeSvg(svgContent);

    expect(result).not.toContain('foreignObject');
    expect(result).not.toContain('onclick');
  });

  it('returns an empty string for malformed XML', () => {
    expect(sanitizeSvg('<svg><path d="M1 2"></svg>')).toBe('');
  });

  it('returns an empty string when the root element is not svg', () => {
    expect(sanitizeSvg('<div><script>alert(1)</script></div>')).toBe('');
  });
});
