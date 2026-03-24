import {Directive, ElementRef, HostBinding, HostListener, inject, Injector, input} from '@angular/core';
import {VsCode} from '../services/vs-code';
import {FileLocation} from '../models/file-location';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {PopupMenu} from './popup-menu/popup-menu';
import {MenuItem} from './popup-menu/menu-item';
import {getParentDirectory, toDisplayFilePath} from '../utilities/path';

@Directive({
  selector: '[sigridFindingNavigator]',
})
export class FindingNavigator {
  locations = input<FileLocation[] | undefined | null>();

  @HostBinding('attr.tabindex')
  tabIndex = -1;

  private readonly vscode = inject(VsCode);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private overlayRef?: OverlayRef;

  @HostListener('mousedown')
  onMouseDown() {
    this.elementRef.nativeElement.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.hasLocations()) { return; }

    const rows = this.getNavigableRows();
    const currentIndex = rows.indexOf(this.elementRef.nativeElement);

    if (currentIndex === -1) { return; }

    switch (event.key) {
      case 'Escape':
        this.elementRef.nativeElement.blur();
        return;

      case 'Home':
        event.preventDefault();
        rows[0]?.focus();
        return;

      case 'End':
        event.preventDefault();
        rows[rows.length - 1]?.focus();
        return;

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onDblClick(event as unknown as MouseEvent);
        return;

      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.focusSiblingRow(rows, currentIndex, event.key);
        return;

      default:
        return;
    }
  }

  private hasLocations(): boolean {
    const locations = this.locations();
    return !!locations?.length;
  }

  private getNavigableRows(): HTMLElement[] {
    return Array.from(
      (this.elementRef.nativeElement.parentElement?.querySelectorAll('tr[sigridFindingNavigator]') ?? []) as NodeListOf<HTMLElement>
    )
  }

  private focusSiblingRow(rows: HTMLElement[], currentIndex: number, key: 'ArrowDown' | 'ArrowUp') {
    const nextIndex = key === 'ArrowDown'
      ? Math.min(currentIndex + 1, rows.length - 1)
      : Math.max(currentIndex - 1, 0);

    rows[nextIndex]?.focus();
  }

  @HostListener('dblclick', ['$event'])
  onDblClick(event: MouseEvent) {
    event.preventDefault();

    const locations = this.locations();
    if (!locations || locations.length === 0) { return; }

    if (locations.length === 1) {
      this.vscode.openFile(locations[0]);
    } else {
      this.showPopup(locations);
    }
  }

  private showPopup(locations: FileLocation[]) {
    if (this.overlayRef) {
      this.closePopup();
      return;
    }

    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    this.overlayRef.backdropClick().subscribe(() => this.closePopup());

    const portal = new ComponentPortal(PopupMenu, null, this.injector);
    const componentRef = this.overlayRef.attach(portal);
    const menuItems = locations.map(location => ({
      label: `${toDisplayFilePath(location.filePath, '')}${location.startLine == null || location.startLine === 0 ? '' : ':' + location.startLine}`,
      description: getParentDirectory(location.filePath),
      action: () => this.onItemSelect(location)
    } as MenuItem ));
    componentRef.setInput('items', menuItems);
    componentRef.instance.close.subscribe(() => this.closePopup());
  }

  private closePopup() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  onItemSelect(location: FileLocation) {
    this.vscode.openFile(location);
    this.closePopup();
  }
}
