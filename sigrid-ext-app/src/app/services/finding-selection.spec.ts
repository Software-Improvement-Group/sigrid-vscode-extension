import { TestBed } from '@angular/core/testing';
import { FindingSelectionService, SelectedFinding } from './finding-selection';
import { RiskSeverity } from '../models/risk-severity';

function makeFinding(id: string): SelectedFinding {
  return {
    id,
    category: 'Security',
    title: `Finding ${id}`,
    severity: RiskSeverity.High,
    fileLocations: [{ component: 'comp', filePath: 'src/file.ts' }],
  };
}

describe('FindingSelectionService', () => {
  let service: FindingSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FindingSelectionService],
    });

    service = TestBed.inject(FindingSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toggle', () => {
    it('adds a finding to the selection when not already selected', () => {
      const finding = makeFinding('f1');
      service.toggle(finding);
      expect(service.isSelected('f1')).toBe(true);
    });

    it('removes a finding from the selection when already selected', () => {
      const finding = makeFinding('f1');
      service.toggle(finding);
      service.toggle(finding);
      expect(service.isSelected('f1')).toBe(false);
    });

    it('supports toggling multiple different findings', () => {
      service.toggle(makeFinding('f1'));
      service.toggle(makeFinding('f2'));
      expect(service.isSelected('f1')).toBe(true);
      expect(service.isSelected('f2')).toBe(true);
    });
  });

  describe('isSelected', () => {
    it('returns false for an id that was never added', () => {
      expect(service.isSelected('nonexistent')).toBe(false);
    });
  });

  describe('selectedCount', () => {
    it('is 0 initially', () => {
      expect(service.selectedCount()).toBe(0);
    });

    it('increments when a finding is toggled in', () => {
      service.toggle(makeFinding('f1'));
      expect(service.selectedCount()).toBe(1);
    });

    it('decrements when a finding is toggled out', () => {
      service.toggle(makeFinding('f1'));
      service.toggle(makeFinding('f1'));
      expect(service.selectedCount()).toBe(0);
    });
  });

  describe('getAll', () => {
    it('returns an empty array initially', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns all toggled-in findings', () => {
      const f1 = makeFinding('f1');
      const f2 = makeFinding('f2');
      service.toggle(f1);
      service.toggle(f2);

      const all = service.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(f1);
      expect(all).toContainEqual(f2);
    });

    it('does not include findings that were toggled out', () => {
      service.toggle(makeFinding('f1'));
      service.toggle(makeFinding('f2'));
      service.toggle(makeFinding('f1'));

      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('f2');
    });
  });

  describe('clear', () => {
    it('removes all selections', () => {
      service.toggle(makeFinding('f1'));
      service.toggle(makeFinding('f2'));
      service.clear();
      expect(service.getAll()).toEqual([]);
    });

    it('resets selectedCount to 0', () => {
      service.toggle(makeFinding('f1'));
      service.clear();
      expect(service.selectedCount()).toBe(0);
    });

    it('causes isSelected to return false for previously selected items', () => {
      service.toggle(makeFinding('f1'));
      service.clear();
      expect(service.isSelected('f1')).toBe(false);
    });
  });
});
