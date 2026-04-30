import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColumnFilterDropdown, FilterOption } from './column-filter-dropdown';

describe('ColumnFilterDropdown', () => {
  let component: ColumnFilterDropdown;
  let fixture: ComponentFixture<ColumnFilterDropdown>;

  const testOptions: FilterOption[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnFilterDropdown],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnFilterDropdown);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('initializes currentSelected from the selected input', () => {
      fixture.componentRef.setInput('options', testOptions);
      fixture.componentRef.setInput('selected', new Set(['high']));
      fixture.detectChanges();

      expect(component['currentSelected']()).toEqual(new Set(['high']));
    });
  });

  describe('toggle', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('options', testOptions);
      fixture.componentRef.setInput('selected', new Set());
      fixture.detectChanges();
    });

    it('adds a value to currentSelected and emits selectionChange', () => {
      const emitted: Set<string>[] = [];
      component.selectionChange.subscribe(v => emitted.push(v));

      component['toggle']('high');

      expect(component['currentSelected']()).toEqual(new Set(['high']));
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(new Set(['high']));
    });

    it('removes a value from currentSelected when already present', () => {
      component['toggle']('high');
      component['toggle']('high');

      expect(component['currentSelected']()).toEqual(new Set());
    });

    it('does not mutate the previous Set', () => {
      component['toggle']('high');
      const first = component['currentSelected']();
      component['toggle']('medium');
      const second = component['currentSelected']();

      expect(first).not.toBe(second);
    });
  });

  describe('clearAll', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('options', testOptions);
      fixture.componentRef.setInput('selected', new Set(['high', 'medium']));
      fixture.detectChanges();
    });

    it('resets currentSelected to an empty set', () => {
      component['clearAll']();
      expect(component['currentSelected']().size).toBe(0);
    });

    it('emits selectionChange with an empty set', () => {
      const emitted: Set<string>[] = [];
      component.selectionChange.subscribe(v => emitted.push(v));

      component['clearAll']();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].size).toBe(0);
    });
  });

  describe('Escape key handling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('options', testOptions);
      fixture.componentRef.setInput('selected', new Set());
      fixture.detectChanges();
    });

    it('emits close when Escape key is pressed', () => {
      let closed = false;
      component.close.subscribe(() => (closed = true));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeydown(event);

      expect(closed).toBe(true);
    });

    it('does not emit close for other keys', () => {
      let closed = false;
      component.close.subscribe(() => (closed = true));

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(event);

      expect(closed).toBe(false);
    });
  });
});
