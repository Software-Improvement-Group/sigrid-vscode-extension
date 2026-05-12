import {Component, effect, inject, input, signal} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {AppResource} from '../../services/app-resource.service';

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
    this.loadSvgIcon(`${name}.svg`).then();
  });

  private async loadSvgIcon(fileName: string) {
    const svgContent = await this.appResource.loadSvgContent(fileName);
    this.svgHtml.set(svgContent ? this.sanitizer.bypassSecurityTrustHtml(svgContent) : ('' as SafeHtml));
  }
}
