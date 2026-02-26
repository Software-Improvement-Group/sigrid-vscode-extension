import {ComponentFixture, TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {SelectButton} from './select-button';

describe('SelectButton', () => {
  let component: SelectButton;
  let fixture: ComponentFixture<SelectButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectButton],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectButton);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('initializes value to the first option’s optionValue on init', () => {
    fixture.componentRef.setInput('options', [
      {label: 'All', value: 'all'},
      {label: 'Active', value: 'active'},
    ]);

    fixture.detectChanges(); // runs ngOnInit

    expect((component as any).value).toBe('all');
  });

  it('initializes value to undefined when options is empty', () => {
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();

    expect((component as any).value).toBeUndefined();
  });

  it('select sets value from the item using optionValue and emits change', () => {
    fixture.componentRef.setInput('options', [{label: 'A', value: 'a'}]);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.change, 'emit');

    (component as any).select({label: 'B', value: 'b'});

    expect((component as any).value).toBe('b');
    expect(emitSpy).toHaveBeenCalledWith('b');
  });

  it('select respects a custom optionValue key', () => {
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.change, 'emit');

    (component as any).select({label: 'X', id: 123});

    expect((component as any).value).toBe(123);
    expect(emitSpy).toHaveBeenCalledWith(123);
  });
});
