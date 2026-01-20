import { TestBed } from '@angular/core/testing';

import { SigridConfiguration } from './sigrid-configuration';

describe('Configuration', () => {
  let service: SigridConfiguration;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SigridConfiguration);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
