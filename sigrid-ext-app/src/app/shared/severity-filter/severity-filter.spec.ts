import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeverityFilter } from './severity-filter';

describe('SeverityFilter', () => {
  let component: SeverityFilter;
  let fixture: ComponentFixture<SeverityFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeverityFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeverityFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
