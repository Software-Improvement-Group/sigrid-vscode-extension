import { TestBed } from '@angular/core/testing';

import { SigridData } from './sigrid-data';

describe('SigridData', () => {
  let service: SigridData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SigridData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
