import {computed, Injectable, signal, WritableSignal} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FindingFilterService {
  readonly searchTerm = signal('');

  private readonly filters = new Map<string, Map<string, WritableSignal<Set<string>>>>();

  getColumnFilter(tabId: string, columnKey: string): WritableSignal<Set<string>> {
    if (!this.filters.has(tabId)) {
      this.filters.set(tabId, new Map());
    }
    const tabFilters = this.filters.get(tabId)!;
    if (!tabFilters.has(columnKey)) {
      tabFilters.set(columnKey, signal(new Set<string>()));
    }
    return tabFilters.get(columnKey)!;
  }

  setColumnFilter(tabId: string, columnKey: string, values: Set<string>) {
    this.getColumnFilter(tabId, columnKey).set(values);
  }

  clearAllFilters(tabId: string) {
    const tabFilters = this.filters.get(tabId);
    if (tabFilters) {
      tabFilters.forEach(filterSignal => filterSignal.set(new Set()));
    }
  }

  hasActiveFilters(tabId: string) {
    return computed(() => {
      const tabFilters = this.filters.get(tabId);
      if (!tabFilters) return false;
      for (const filterSignal of tabFilters.values()) {
        if (filterSignal().size > 0) return true;
      }
      return false;
    });
  }
}
