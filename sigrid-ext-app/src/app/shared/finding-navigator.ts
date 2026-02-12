import {Directive, HostListener, inject, input} from '@angular/core';
import {VsCode} from '../services/vs-code.service';

@Directive({
  selector: '[sigridFindingNavigator]',
})
export class FindingNavigator {
  filePath = input<string | undefined | null>('');
  vscode = inject(VsCode)

  @HostListener('dblclick', ['$event'])
  onDblClick(event: MouseEvent) {
    event.preventDefault();
    const filePath = this.filePath();
    if (filePath) {
      this.vscode.openFile(filePath);
    }
  }
}
