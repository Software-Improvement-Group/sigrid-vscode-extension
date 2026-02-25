import {ComponentFixture, TestBed} from '@angular/core/testing';
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

  it('writeValue sets the internal value', () => {
    fixture.detectChanges();

    component.writeValue('x');
    expect((component as any).value).toBe('x');
  });

  it('registerOnChange stores the callback (does not call it from select)', () => {
    fixture.detectChanges();

    const onChange = vi.fn();
    component.registerOnChange(onChange);

    (component as any).select({label: 'A', value: 'a'});
    expect(onChange).not.toHaveBeenCalled();
  });

  it('registerOnTouched stores the callback (does not call it from select)', () => {
    fixture.detectChanges();

    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);

    (component as any).select({label: 'A', value: 'a'});
    expect(onTouched).not.toHaveBeenCalled();
  });

  it('setDisabledState updates isDisabled', () => {
    fixture.detectChanges();

    component.setDisabledState?.(true);
    expect((component as any).isDisabled).toBe(true);

    component.setDisabledState?.(false);
    expect((component as any).isDisabled).toBe(false);
  });

  it('select sets value from the item using optionValue and emits change', () => {
    fixture.componentRef.setInput('options', [{label: 'A', value: 'a'}]);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.change, 'emit');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    (component as any).select({label: 'B', value: 'b'});

    expect((component as any).value).toBe('b');
    expect(emitSpy).toHaveBeenCalledWith('b');
    expect(logSpy).toHaveBeenCalledWith('b');

    logSpy.mockRestore();
  });

  it('select respects a custom optionValue key', () => {
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.change, 'emit');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    (component as any).select({label: 'X', id: 123});

    expect((component as any).value).toBe(123);
    expect(emitSpy).toHaveBeenCalledWith(123);
    expect(logSpy).toHaveBeenCalledWith(123);

    logSpy.mockRestore();
  });
});
