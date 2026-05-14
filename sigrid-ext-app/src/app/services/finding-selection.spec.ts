import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it} from 'vitest';
import {SelectedFinding} from '../models/selected-finding';
import {FindingSelection} from './finding-selection';

describe('FindingSelection', () => {
  let service: FindingSelection;

  const findingOne: SelectedFinding = {
    id: 'maintainability-1',
    category: 'Maintainability',
    title: 'Long method',
    severity: 'high',
    fileLocations: [
      {
        filePath: 'src/app/example.ts',
        startLine: 10,
        endLine: 20,
        component: 'component-1',
      },
    ],
  };

  const findingTwo: SelectedFinding = {
    id: 'security-1',
    category: 'Security',
    title: 'SQL injection',
    severity: 'critical',
    fileLocations: [
      {
        filePath: 'src/app/security.ts',
        startLine: 42,
        endLine: 42,
        component: 'component-2',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FindingSelection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with no selected findings', () => {
    expect(service.selectedCount()).toBe(0);
    expect(service.getAll()).toEqual([]);
    expect(service.isSelected(findingOne.id)).toBe(false);
  });

  it('selects a finding when toggled on', () => {
    service.toggle(findingOne);

    expect(service.selectedCount()).toBe(1);
    expect(service.isSelected(findingOne.id)).toBe(true);
    expect(service.getAll()).toEqual([findingOne]);
  });

  it('unselects a selected finding when toggled again', () => {
    service.toggle(findingOne);
    service.toggle(findingOne);

    expect(service.selectedCount()).toBe(0);
    expect(service.isSelected(findingOne.id)).toBe(false);
    expect(service.getAll()).toEqual([]);
  });

  it('tracks multiple selected findings', () => {
    service.toggle(findingOne);
    service.toggle(findingTwo);

    expect(service.selectedCount()).toBe(2);
    expect(service.isSelected(findingOne.id)).toBe(true);
    expect(service.isSelected(findingTwo.id)).toBe(true);
    expect(service.getAll()).toEqual([findingOne, findingTwo]);
  });

  it('removes only the matching finding when toggling one of multiple selections', () => {
    service.toggle(findingOne);
    service.toggle(findingTwo);

    service.toggle(findingOne);

    expect(service.selectedCount()).toBe(1);
    expect(service.isSelected(findingOne.id)).toBe(false);
    expect(service.isSelected(findingTwo.id)).toBe(true);
    expect(service.getAll()).toEqual([findingTwo]);
  });

  it('uses the finding id to determine whether an item is already selected', () => {
    const updatedFindingOne: SelectedFinding = {
      ...findingOne,
      title: 'Updated title',
      severity: 'medium',
    };

    service.toggle(findingOne);
    service.toggle(updatedFindingOne);

    expect(service.selectedCount()).toBe(0);
    expect(service.isSelected(findingOne.id)).toBe(false);
    expect(service.getAll()).toEqual([]);
  });

  it('clears all selected findings', () => {
    service.toggle(findingOne);
    service.toggle(findingTwo);

    service.clear();

    expect(service.selectedCount()).toBe(0);
    expect(service.isSelected(findingOne.id)).toBe(false);
    expect(service.isSelected(findingTwo.id)).toBe(false);
    expect(service.getAll()).toEqual([]);
  });

  it('can select a finding again after clearing', () => {
    service.toggle(findingOne);
    service.clear();

    service.toggle(findingTwo);

    expect(service.selectedCount()).toBe(1);
    expect(service.isSelected(findingOne.id)).toBe(false);
    expect(service.isSelected(findingTwo.id)).toBe(true);
    expect(service.getAll()).toEqual([findingTwo]);
  });
});
