import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AppResource} from './app-resource';

describe('AppResource', () => {
  let service: AppResource;

  beforeEach(() => {
    vi.restoreAllMocks();

    TestBed.configureTestingModule({});
    service = TestBed.inject(AppResource);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns an empty webview URL before the base URI is set', () => {
    expect(service.getWebviewUrl('jira.svg')).toBe('');
  });

  it('builds a webview URL from the configured base URI and path segments', () => {
    service.setWebviewBaseUri('https://example.com/assets');

    expect(service.getWebviewUrl('icons', 'jira.svg')).toBe('https://example.com/assets/icons/jira.svg');
  });

  it('updates webview URLs when the base URI changes', () => {
    service.setWebviewBaseUri('https://first.example.com/assets');
    expect(service.getWebviewUrl('jira.svg')).toBe('https://first.example.com/assets/jira.svg');

    service.setWebviewBaseUri('https://second.example.com/resources');
    expect(service.getWebviewUrl('jira.svg')).toBe('https://second.example.com/resources/jira.svg');
  });

  it('loads SVG content from the resolved webview URL', async () => {
    const svgContent = '<svg><path d="M1 2"></path></svg>';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(svgContent),
    } as unknown as Response);

    service.setWebviewBaseUri('https://example.com/assets');

    await expect(service.loadSvgContent('jira.svg')).resolves.toBe(svgContent);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/assets/jira.svg');
  });

  it('returns an empty string and does not fetch when the webview URL is empty', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(service.loadSvgContent('jira.svg')).resolves.toBe('');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty string and logs an error when fetching SVG content fails', async () => {
    const error = new Error('Network error');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    service.setWebviewBaseUri('https://example.com/assets');

    await expect(service.loadSvgContent('jira.svg')).resolves.toBe('');

    expect(consoleError).toHaveBeenCalledWith('Error loading SVG jira.svg:', error);
  });

  it('returns an empty string and logs an error when the SVG response is not ok', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    service.setWebviewBaseUri('https://example.com/assets');

    await expect(service.loadSvgContent('missing.svg')).resolves.toBe('');

    expect(consoleError).toHaveBeenCalledWith('Error loading SVG missing.svg:', expect.any(Error));
    expect(consoleError.mock.calls[0][1].message).toBe('Failed to load missing.svg: Not Found');
  });
});
