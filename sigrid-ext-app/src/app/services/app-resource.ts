import {Injectable, signal} from '@angular/core';
import {joinUrl} from '../utilities/join-url';

@Injectable({
  providedIn: 'root',
})
export class AppResource {
  private webviewBaseUri = signal<string>('');

  setWebviewBaseUri(uri: string) {
    this.webviewBaseUri.set(uri);
  }

  getWebviewUrl(...paths: string[]) {
    return !this.webviewBaseUri() ? '' : joinUrl(this.webviewBaseUri(), ...paths);
  }

  async loadSvgContent(fileName: string): Promise<string> {
    if (!this.isValidSvgFileName(fileName)) {
      console.error(`Rejected invalid SVG file name: ${fileName}`);
      return '';
    }
    try {
      return await this.fetchSvgContent(fileName);
    } catch (error) {
      console.error(`Error loading SVG ${fileName}:`, error);
      return '';
    }
  }

  private isValidSvgFileName(fileName: string): boolean {
    return /^[a-z0-9-]+\.svg$/.test(fileName);
  }

  private async fetchSvgContent(fileName: string): Promise<string> {
    const url = this.getWebviewUrl(fileName);
    if (!url) {
      return '';
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
    }
    return await response.text();
  }
}
