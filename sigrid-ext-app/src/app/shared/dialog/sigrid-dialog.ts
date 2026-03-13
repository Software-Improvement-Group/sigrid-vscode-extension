import {EnvironmentInjector, inject, Injectable, Injector} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {filter, take} from 'rxjs';
import {ComponentPortal} from '@angular/cdk/portal';
import {Dialog} from './dialog';
import {DialogRef} from './dialog-ref';

@Injectable({
  providedIn: 'root',
})
export class SigridDialog {
  private overlay = inject(Overlay);
  private injector = inject(EnvironmentInjector);

  open<T>(component: any, data?: Record<string, any>): OverlayRef {
    const overlayRef = this.createOverlay();
    const dialogRef = new DialogRef<T>(overlayRef);

    // Attach popup container
    const dialogPortal = new ComponentPortal(Dialog, null, this.createInjector(dialogRef));
    const dialogComponentRef = overlayRef.attach(dialogPortal);

    // Attach component content into popup
    const contentPortal = new ComponentPortal(component, null, this.createInjector(dialogRef));
    const componentRef = dialogComponentRef.instance.outlet.attach(contentPortal);

    // set inputs
    if (data) {
      //Object.assign(componentRef.instance, data);
      for (const key in data) {
        componentRef.setInput(key, data[key]);
      }
    }

    this.registerCloseHandlers(overlayRef);
    return overlayRef;
  }

  private createInjector(popupRef: DialogRef<any>) {
    return Injector.create({
      providers: [{ provide: DialogRef, useValue: popupRef }],
      parent: this.injector,
    });
  }

  private createOverlay(): OverlayRef {
    return this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
    });
  }

  private registerCloseHandlers(overlayRef: OverlayRef) {
    // Close on backdrop click
    overlayRef.backdropClick().pipe(take(1)).subscribe(() => overlayRef.dispose());

    // Close on ESC
    overlayRef.keydownEvents()
      .pipe(
        filter(event => event.key === 'Escape' || event.key === 'Esc'),
        take(1)
      )
      .subscribe(() => overlayRef.dispose());
  }
}
