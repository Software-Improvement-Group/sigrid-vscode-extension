import { TestBed } from '@angular/core/testing';

import { SigridDialog } from './sigrid-dialog';

describe('SigridDialog', () => {
  let service: SigridDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SigridDialog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
