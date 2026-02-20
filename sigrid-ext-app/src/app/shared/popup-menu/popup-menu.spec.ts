import {ComponentFixture, TestBed} from '@angular/core/testing';
import {describe, expect, it, vi} from 'vitest';
import {PopupMenu} from './popup-menu';

describe('PopupMenu', () => {
  let component: PopupMenu;
  let fixture: ComponentFixture<PopupMenu>;

  const keyCodeFor = (key: string) => {
    switch (key) {
      case 'ArrowDown': return 40;
      case 'ArrowUp': return 38;
      case 'Enter': return 13;
      case 'Escape': return 27;
      default: return 0;
    }
  };

  const keyEvent = (key: string) => {
    const e = new KeyboardEvent('keydown', {key, bubbles: true});
    const code = keyCodeFor(key);

    // jsdom makes these 0 and readonly; patch them so CDK key manager behaves like in a real browser
    Object.defineProperty(e, 'keyCode', {get: () => code});
    Object.defineProperty(e, 'which', {get: () => code});

    return e;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(PopupMenu);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('sets first item active after view init', async () => {
    fixture.componentRef.setInput('items', [
      {label: 'One', action: vi.fn()},
      {label: 'Two', action: vi.fn()},
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.keyManager).toBeTruthy();
    expect(component.keyManager.activeItemIndex).toBe(0);
  });

  it('ArrowDown/ArrowUp updates active item (wraps)', async () => {
    fixture.componentRef.setInput('items', [
      {label: 'One', action: vi.fn()},
      {label: 'Two', action: vi.fn()},
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.keyManager.activeItemIndex).toBe(0);

    component.onKeydown(keyEvent('ArrowDown'));
    expect(component.keyManager.activeItemIndex).toBe(1);

    component.onKeydown(keyEvent('ArrowDown'));
    expect(component.keyManager.activeItemIndex).toBe(0);

    component.onKeydown(keyEvent('ArrowUp'));
    expect(component.keyManager.activeItemIndex).toBe(1);
  });

  it('Enter triggers action for active item', async () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    fixture.componentRef.setInput('items', [
      {label: 'One', action: action1},
      {label: 'Two', action: action2},
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    component.onKeydown(keyEvent('Enter'));
    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).toHaveBeenCalledTimes(0);

    component.onKeydown(keyEvent('ArrowDown'));
    component.onKeydown(keyEvent('Enter'));
    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).toHaveBeenCalledTimes(1);
  });

  it('Escape emits close', async () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('items', [{label: 'One', action: vi.fn()}]);

    fixture.detectChanges();
    await fixture.whenStable();

    component.onKeydown(keyEvent('Escape'));
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('clicking an item triggers its action', async () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    fixture.componentRef.setInput('items', [
      {label: 'One', action: action1},
      {label: 'Two', action: action2},
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const items = Array.from(fixture.nativeElement.querySelectorAll('li')) as HTMLLIElement[];
    expect(items.length).toBe(2);

    items[1]!.click();
    expect(action1).toHaveBeenCalledTimes(0);
    expect(action2).toHaveBeenCalledTimes(1);
  });

  it('does nothing on Enter if the active item has no action', async () => {
    fixture.componentRef.setInput('items', [{label: 'One'} as any]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(() => component.onKeydown(keyEvent('Enter'))).not.toThrow();
  });
});
