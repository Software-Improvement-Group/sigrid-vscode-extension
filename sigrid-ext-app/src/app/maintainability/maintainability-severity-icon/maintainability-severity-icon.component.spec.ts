import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintainabilitySeverityIcon } from './maintainability-severity-icon.component';

describe('MaintainabilityServerityIcon', () => {
  let component: MaintainabilitySeverityIcon;
  let fixture: ComponentFixture<MaintainabilitySeverityIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintainabilitySeverityIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintainabilitySeverityIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
