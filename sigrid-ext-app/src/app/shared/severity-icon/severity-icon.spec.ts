import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeverityIcon } from './severity-icon';

describe('SeverityIcon', () => {
  let component: SeverityIcon;
  let fixture: ComponentFixture<SeverityIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeverityIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeverityIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
