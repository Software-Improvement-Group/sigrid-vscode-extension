import {Component, effect, inject, input, signal} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {AppResource} from '../../services/app-resource';
import {isSvgIconName} from './svg-icon-names';
import {sanitizeSvg} from '../../utilities/sanitize-svg';

@Component({
  selector: 'sigrid-svg-icon',
  templateUrl: './svg-icon.html',
  styleUrl: './svg-icon.scss',
})
export class SvgIcon {
  iconName = input.required<string>();
  svgHtml = signal<SafeHtml>('');

  private sanitizer = inject(DomSanitizer);
  private appResource = inject(AppResource);

  private iconNameEffect = effect(() => {
    const name = this.iconName();
    if (!name) {
      this.svgHtml.set('' as SafeHtml);
      return;
    }
    if (!isSvgIconName(name)) {
      console.warn(`Rejected unknown SVG icon name: ${name}`);
      this.svgHtml.set('' as SafeHtml);
      return;
    }
    this.loadSvgIcon(`${name}.svg`).then();
  });

  private async loadSvgIcon(fileName: string) {
    const svgContent = await this.appResource.loadSvgContent(fileName);
    if (!svgContent) {
      return;
    }
    const sanitizedContent = sanitizeSvg(svgContent);
    if (sanitizedContent) {
      this.svgHtml.set(this.sanitizer.bypassSecurityTrustHtml(sanitizedContent));
    } else {
      this.svgHtml.set('' as SafeHtml);
    }
  }
}
