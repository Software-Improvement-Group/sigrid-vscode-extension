import {computed, Injectable, signal} from '@angular/core';
import {SelectedFinding} from '../models/selected-finding';

@Injectable({
  providedIn: 'root',
})
export class FindingSelection {
  private readonly _selected = signal<Map<string, SelectedFinding>>(new Map());

  readonly selectedCount = computed(() => this._selected().size);

  toggle(finding: SelectedFinding) {
    const current = this._selected();
    const updated = new Map(current);
    if (updated.has(finding.id)) {
      updated.delete(finding.id);
    } else {
      updated.set(finding.id, finding);
    }
    this._selected.set(updated);
  }

  isSelected(id: string): boolean {
    return this._selected().has(id);
  }

  getAll(): SelectedFinding[] {
    return Array.from(this._selected().values());
  }

  clear() {
    this._selected.set(new Map());
  }
}
