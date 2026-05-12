import { TestBed } from '@angular/core/testing';

import { AppResource } from './app-resource.service';

describe('Resource', () => {
  let service: AppResource;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppResource);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
