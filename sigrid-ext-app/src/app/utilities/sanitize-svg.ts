const UNSAFE_URL_SCHEMES = ['javascript:', 'data:text/html'];

export function sanitizeSvg(svgContent: string): string {
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const root = doc.documentElement;

  if (doc.querySelector('parsererror') || root.tagName.toLowerCase() !== 'svg') {
    return '';
  }

  removeUnsafeElements(root);
  removeUnsafeAttributes(root);

  return new XMLSerializer().serializeToString(root);
}

function removeUnsafeElements(root: Element): void {
  root.querySelectorAll('script, foreignObject').forEach(element => element.remove());
}

function removeUnsafeAttributes(root: Element): void {
  root.querySelectorAll('*').forEach(element => {
    for (const attribute of Array.from(element.attributes)) {
      if (isUnsafeAttribute(attribute.name, attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  });
}

function isUnsafeAttribute(name: string, value: string): boolean {
  if (name.toLowerCase().startsWith('on')) {
    return true;
  }

  const localName = name.toLowerCase().split(':').pop();
  if (localName !== 'href') {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return UNSAFE_URL_SCHEMES.some(scheme => normalizedValue.startsWith(scheme));
}
