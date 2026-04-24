import {computed, Injectable, signal} from '@angular/core';
import {FileLocation} from '../models/file-location';
import {RiskSeverity} from '../models/risk-severity';
import {MaintainabilitySeverity} from '../models/maintainability-severity';

export interface SelectedFinding {
  id: string;
  category: string;
  title: string;
  severity: string | RiskSeverity | MaintainabilitySeverity;
  fileLocations: FileLocation[];
}

@Injectable({
  providedIn: 'root',
})
export class FindingSelectionService {
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
