import {Directive, HostListener, inject, input} from '@angular/core';
import {VsCode} from '../services/vs-code.service';
import {FileLocation} from '../models/file-location';

@Directive({
  selector: '[sigridFindingNavigator]',
})
export class FindingNavigator {
  locations = input<FileLocation[] | undefined | null>();
  vscode = inject(VsCode)

  @HostListener('dblclick', ['$event'])
  onDblClick(event: MouseEvent) {
    event.preventDefault();

    const locations = this.locations();
    if (!locations || locations.length === 0) { return; }

    if (locations.length === 1) {
      this.vscode.openFile(locations[0]);
    } else {
      // todo: show popup with all locations
    }
  }
}
