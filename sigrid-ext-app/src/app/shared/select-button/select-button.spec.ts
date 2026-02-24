import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectButton } from './select-button';

describe('SelectButton', () => {
  let component: SelectButton;
  let fixture: ComponentFixture<SelectButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
