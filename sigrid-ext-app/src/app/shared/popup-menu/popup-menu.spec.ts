import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenu } from './popup-menu';

describe('PopupMenu', () => {
  let component: PopupMenu;
  let fixture: ComponentFixture<PopupMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
