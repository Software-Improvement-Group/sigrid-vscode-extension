import {Component, ElementRef, inject, input, output, signal, ViewChild} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {ColumnFilterDropdown, FilterOption} from '../column-filter-dropdown/column-filter-dropdown';
import {filter, take} from 'rxjs';

@Component({
  selector: 'sigrid-filterable-header',
  imports: [],
  templateUrl: './filterable-header.html',
  styleUrl: './filterable-header.scss',
})
export class FilterableHeader {
  label = input.required<string>();
  options = input<FilterOption[]>([]);
  selected = input<Set<string>>(new Set());
  selectionChange = output<Set<string>>();
  centerLabel = input(false);

  private overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;
  protected isOpen = signal(false);

  @ViewChild('headerEl', {static: true}) headerEl!: ElementRef;

  protected get isActive(): boolean {
    return this.selected().size > 0;
  }

  protected toggleDropdown() {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown() {
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.headerEl)
        .withPositions([
          {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
          {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
        ]),
    });

    const portal = new ComponentPortal(ColumnFilterDropdown);
    const ref = this.overlayRef.attach(portal);
    ref.setInput('options', this.options());
    ref.setInput('selected', this.selected());

    ref.instance.selectionChange.subscribe((values: Set<string>) => {
      this.selectionChange.emit(values);
    });

    ref.instance.close.subscribe(() => {
      this.closeDropdown();
    });

    this.overlayRef.backdropClick().pipe(take(1)).subscribe(() => this.closeDropdown());
    this.overlayRef.keydownEvents()
      .pipe(filter(e => e.key === 'Escape'), take(1))
      .subscribe(() => this.closeDropdown());

    this.isOpen.set(true);
  }

  private closeDropdown() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
  }
}
