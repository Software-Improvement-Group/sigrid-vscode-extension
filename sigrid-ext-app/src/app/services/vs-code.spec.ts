import { TestBed } from '@angular/core/testing';

import { VsCode } from './vs-code.service';

describe('Vscode', () => {
  let service: VsCode;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VsCode);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
