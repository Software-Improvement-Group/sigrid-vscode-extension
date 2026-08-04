import {inject, Injectable, Injector} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {PopupMenu} from '../shared/popup-menu/popup-menu';
import {MenuItem} from '../shared/popup-menu/menu-item';

/** Shows a centered popup menu in a CDK overlay. At most one menu is open at a time. */
@Injectable({
  providedIn: 'root',
})
export class PopupMenuService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private overlayRef?: OverlayRef;

  /** Opens the menu or closes it again when it is already open. */
  open(items: MenuItem[]) {
    if (this.overlayRef) {
      this.close();
      return;
    }

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });
    this.overlayRef.backdropClick().subscribe(() => this.close());

    const componentRef = this.overlayRef.attach(new ComponentPortal(PopupMenu, null, this.injector));
    componentRef.setInput('items', items.map(item => this.closeAfterAction(item)));
    componentRef.instance.close.subscribe(() => this.close());
  }

  close() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  private closeAfterAction(item: MenuItem): MenuItem {
    return {
      ...item,
      action: () => {
        this.close();
        item.action();
      }
    };
  }
}
