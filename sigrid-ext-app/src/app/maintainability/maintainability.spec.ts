import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Maintainability } from './maintainability';

describe('Maintainability', () => {
  let component: Maintainability;
  let fixture: ComponentFixture<Maintainability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maintainability]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Maintainability);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
