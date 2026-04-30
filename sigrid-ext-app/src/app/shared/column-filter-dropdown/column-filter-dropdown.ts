import {Component, HostListener, input, output, signal} from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'sigrid-column-filter-dropdown',
  imports: [],
  templateUrl: './column-filter-dropdown.html',
  styleUrl: './column-filter-dropdown.scss',
})
export class ColumnFilterDropdown {
  options = input<FilterOption[]>([]);
  selected = input<Set<string>>(new Set());
  selectionChange = output<Set<string>>();
  close = output<void>();

  protected currentSelected = signal<Set<string>>(new Set());

  ngOnInit() {
    this.currentSelected.set(new Set(this.selected()));
  }

  protected toggle(value: string) {
    const next = new Set(this.currentSelected());
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    this.currentSelected.set(next);
    this.selectionChange.emit(next);
  }

  protected clearAll() {
    this.currentSelected.set(new Set());
    this.selectionChange.emit(new Set());
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
