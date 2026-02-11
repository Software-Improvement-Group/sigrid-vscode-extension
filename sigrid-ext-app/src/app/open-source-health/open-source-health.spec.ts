import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenSourceHealth } from './open-source-health';

describe('OpenSourceHealth', () => {
  let component: OpenSourceHealth;
  let fixture: ComponentFixture<OpenSourceHealth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenSourceHealth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenSourceHealth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
