import { FindingNavigator } from './finding-navigator';
import {TestBed} from '@angular/core/testing';

describe('FindingNavigator', () => {

  it('should create an instance', () => {
    TestBed.runInInjectionContext(() => {
      const directive = new FindingNavigator();
      expect(directive).toBeTruthy();
    })
  });
});
