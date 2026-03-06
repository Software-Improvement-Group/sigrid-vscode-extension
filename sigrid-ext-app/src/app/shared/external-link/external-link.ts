import {Component, inject, input} from '@angular/core';
import {VsCode} from '../../services/vs-code';
import {IconButton} from '../icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';

@Component({
  selector: 'sigrid-external-link',
  imports: [
    IconButton,
    TooltipDirective
  ],
  templateUrl: './external-link.html',
  styleUrl: './external-link.scss',
})
export class ExternalLink {
  href = input.required<string>();
  tooltip = input('Open in Sigrid');
  readonly vscode = inject(VsCode);

  protected openLink() {
    this.vscode.openUrl(this.href());
  }
}
