import { TestBed } from '@angular/core/testing';
import { FindingFilterService } from './finding-filter';

describe('FindingFilterService', () => {
  let service: FindingFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FindingFilterService],
    });

    service = TestBed.inject(FindingFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchTerm', () => {
    it('has empty string as default value', () => {
      expect(service.searchTerm()).toBe('');
    });

    it('updates when set', () => {
      service.searchTerm.set('test query');
      expect(service.searchTerm()).toBe('test query');
    });
  });

  describe('getColumnFilter', () => {
    it('returns an empty Set signal for a new tab+column combination', () => {
      const filter = service.getColumnFilter('tab1', 'severity');
      expect(filter().size).toBe(0);
    });

    it('returns the same signal instance on repeated calls with same tab+column', () => {
      const first = service.getColumnFilter('tab1', 'severity');
      const second = service.getColumnFilter('tab1', 'severity');
      expect(first).toBe(second);
    });

    it('returns different signals for different columns on the same tab', () => {
      const severity = service.getColumnFilter('tab1', 'severity');
      const category = service.getColumnFilter('tab1', 'category');
      expect(severity).not.toBe(category);
    });

    it('returns different signals for the same column on different tabs', () => {
      const tab1 = service.getColumnFilter('tab1', 'severity');
      const tab2 = service.getColumnFilter('tab2', 'severity');
      expect(tab1).not.toBe(tab2);
    });
  });

  describe('setColumnFilter', () => {
    it('updates the signal value for the given tab+column', () => {
      service.setColumnFilter('tab1', 'severity', new Set(['High', 'Critical']));
      const filter = service.getColumnFilter('tab1', 'severity');
      expect(filter()).toEqual(new Set(['High', 'Critical']));
    });

    it('creates the filter signal if it did not exist yet', () => {
      service.setColumnFilter('new-tab', 'col', new Set(['val']));
      const filter = service.getColumnFilter('new-tab', 'col');
      expect(filter()).toEqual(new Set(['val']));
    });
  });

  describe('clearAllFilters', () => {
    it('resets all column filters for the given tab to empty sets', () => {
      service.setColumnFilter('tab1', 'severity', new Set(['High']));
      service.setColumnFilter('tab1', 'category', new Set(['XSS']));

      service.clearAllFilters('tab1');

      expect(service.getColumnFilter('tab1', 'severity')().size).toBe(0);
      expect(service.getColumnFilter('tab1', 'category')().size).toBe(0);
    });

    it('does not affect filters on other tabs', () => {
      service.setColumnFilter('tab1', 'severity', new Set(['High']));
      service.setColumnFilter('tab2', 'severity', new Set(['Low']));

      service.clearAllFilters('tab1');

      expect(service.getColumnFilter('tab2', 'severity')()).toEqual(new Set(['Low']));
    });

    it('is a no-op when called for a tab that has no filters', () => {
      expect(() => service.clearAllFilters('unknown-tab')).not.toThrow();
    });
  });

  describe('hasActiveFilters', () => {
    it('returns false when no filters have been set for the tab', () => {
      service.getColumnFilter('tab1', 'severity');
      const hasActive = service.hasActiveFilters('tab1');
      expect(hasActive()).toBe(false);
    });

    it('returns true when at least one column filter has values', () => {
      service.setColumnFilter('tab1', 'severity', new Set(['High']));
      const hasActive = service.hasActiveFilters('tab1');
      expect(hasActive()).toBe(true);
    });

    it('returns false after clearAllFilters', () => {
      service.setColumnFilter('tab1', 'severity', new Set(['High']));
      service.clearAllFilters('tab1');
      const hasActive = service.hasActiveFilters('tab1');
      expect(hasActive()).toBe(false);
    });

    it('returns false for a tab that was never accessed', () => {
      const hasActive = service.hasActiveFilters('never-used');
      expect(hasActive()).toBe(false);
    });
  });
});
