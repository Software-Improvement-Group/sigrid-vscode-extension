import {DataState} from '../models/data-state';
import {SigridFinding} from '../models/sigrid-finding';
import {computed, Directive, HostListener, inject, OnInit, Signal} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {toObservable} from '@angular/core/rxjs-interop';
import {FindingStatusEmoji} from '../models/finding-status';
import {FindingFilterService} from '../services/finding-filter';
import {FilterOption} from './column-filter-dropdown/column-filter-dropdown';
import {pascalCaseToTitleCase} from '../utilities/string';
import {sortBySeverity} from '../utilities/severity-sort';

type FindingItem<T> = T extends readonly (infer U)[] ? U : T;

@Directive()
export abstract class FindingComponent<T> implements OnInit {
  private sigridConfiguration = inject(SigridConfiguration);
  protected filterService = inject(FindingFilterService);
  protected isConfigValid$ = toObservable<boolean>(this.sigridConfiguration.isConfigurationValid);
  protected readonly DataState = DataState;
  protected readonly FindingStatusEmoji = FindingStatusEmoji;
  protected selectedId: string | null = '';
  protected abstract readonly tabId: string;

  protected findings = computed(() => {
    const findings = this.findingSignal();
    if (findings?.data) {
      return findings.data;
    }
    return [];
  });

  protected filteredFindings = computed(() => {
    const all = this.findings();
    if (!Array.isArray(all) || all.length === 0) return all;

    const searchTerm = this.filterService.searchTerm().toLowerCase().trim();

    return (all as any[]).filter(finding => {
      if (!this.matchesColumnFilters(finding)) return false;
      return !(searchTerm && !this.matchesSearch(finding, searchTerm));

    }) as T;
  });

  protected dataState = computed(() => {
    const findings = this.findingSignal();
    if (!findings) {
      return DataState.Loading;
    } else if (findings.data) {
      return DataState.Success;
    }
    return DataState.Error;
  });

  protected errorMessage = computed(() => {
    const findings = this.findingSignal();
    if (this.dataState() == DataState.Error) {
      return findings?.error ?? 'Unknown error';
    }
    return '';
  });

  protected riskOptions = computed(() => {
    const values = (this.findings() as FindingItem<T>[]).map((finding) => this.getRiskFilterValue(finding));
    return this.buildFilterOptions(values, {labelFn: pascalCaseToTitleCase, sortFn: sortBySeverity});
  });

  protected constructor(private findingSignal: Signal<SigridFinding<T> | null>) {
  }

  ngOnInit() {
    this.isConfigValid$.subscribe(isValid => {
      if (isValid) {
        this.loadData();
      }
    });
  }

  protected abstract loadData(): void;
  protected abstract matchesSearch(finding: FindingItem<T>, term: string): boolean;
  protected abstract matchesColumnFilters(finding: FindingItem<T>): boolean;
  protected abstract getRiskFilterValue(finding: FindingItem<T>): string;

  protected buildFilterOptions(values: string[], options?: {
    labelFn?: (value: any) => string,
    sortFn?: (a: any, b: any) => number
  }): FilterOption[] {
    const unique = [...new Set(values)].filter(v => v != null && v !== '');
    if (options?.sortFn) {
      unique.sort(options.sortFn);
    } else {
      unique.sort();
    }
    return unique.map(v => ({value: v, label: options?.labelFn ? options.labelFn(v) : v}));
  }

  setSelectedId(id: string | null) {
    this.selectedId = id;
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.setSelectedId(null);
    }
  }
}
