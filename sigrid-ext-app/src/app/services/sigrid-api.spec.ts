import { TestBed } from '@angular/core/testing';

import { SigridApi } from './sigrid-api';

describe('Sigrid', () => {
  let service: SigridApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SigridApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
