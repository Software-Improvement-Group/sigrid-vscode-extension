import {Component, DebugElement} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Overlay} from '@angular/cdk/overlay';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Subject} from 'rxjs';

import {FindingNavigator} from './finding-navigator';
import {VsCode} from '../services/vs-code';
import type {FileLocation} from '../models/file-location';

@Component({
  standalone: true,
  imports: [FindingNavigator],
  template: `
    <table>
      <tr sigridFindingNavigator [locations]="firstLocations"></tr>
      <tr sigridFindingNavigator [locations]="secondLocations"></tr>
      <tr sigridFindingNavigator [locations]="thirdLocations"></tr>
    </table>
  `,
})
class HostComponent {
  firstLocations: FileLocation[] | null | undefined = undefined;
  secondLocations: FileLocation[] | null | undefined = undefined;
  thirdLocations: FileLocation[] | null | undefined = undefined;
}

describe('FindingNavigator', () => {
  let fixture: ComponentFixture<HostComponent>;
  let hostDe: DebugElement;
  let rows: DebugElement[];

  const openFile = vi.fn();

  let backdropClick$: Subject<MouseEvent>;
  let popupClose$: Subject<void>;

  const overlayRef = {
    attach: vi.fn(() => ({
      setInput: vi.fn(),
      instance: {close: popupClose$},
    })),
    backdropClick: vi.fn(() => backdropClick$.asObservable()),
    dispose: vi.fn(),
  };

  const overlay = {
    position: vi.fn(() => ({
      global: vi.fn(() => ({
        centerHorizontally: vi.fn(() => ({
          centerVertically: vi.fn(() => ({})),
        })),
      })),
    })),
    create: vi.fn(() => overlayRef),
  };

  const dblClickEvent = () => {
    const e = new MouseEvent('dblclick');
    Object.defineProperty(e, 'preventDefault', {value: vi.fn(), configurable: true});
    return e as unknown as MouseEvent & { preventDefault: ReturnType<typeof vi.fn> };
  };

  const keydownEvent = (key: string) => {
    const e = new KeyboardEvent('keydown', {key});
    Object.defineProperty(e, 'preventDefault', {value: vi.fn(), configurable: true});
    return e as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    backdropClick$ = new Subject<MouseEvent>();
    popupClose$ = new Subject<void>();

    openFile.mockReset();

    overlay.position.mockClear();
    overlay.create.mockClear();
    overlayRef.attach.mockClear();
    overlayRef.backdropClick.mockClear();
    overlayRef.dispose.mockClear();

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {provide: VsCode, useValue: {openFile}},
        {provide: Overlay, useValue: overlay},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('sets tabindex to -1 on the host elements', () => {
    fixture.detectChanges();
    rows = fixture.debugElement.queryAll(By.css('tr[sigridFindingNavigator]'));

    expect(rows).toHaveLength(3);
    expect(rows[0]!.attributes['tabindex']).toBe('-1');
    expect(rows[1]!.attributes['tabindex']).toBe('-1');
    expect(rows[2]!.attributes['tabindex']).toBe('-1');
  });

  it('focuses the row on mousedown', () => {
    fixture.componentInstance.firstLocations = [];
    fixture.detectChanges();

    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));
    const focusSpy = vi.spyOn(hostDe.nativeElement, 'focus');

    hostDe.triggerEventHandler('mousedown', new MouseEvent('mousedown'));

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('navigates with keyboard and activates on Enter/Space', () => {
    const firstLoc: FileLocation = {filePath: '/repo/src/a.ts', startLine: 1, endLine: 1} as any;
    const secondLoc: FileLocation = {filePath: '/repo/src/b.ts', startLine: 2, endLine: 2} as any;
    const thirdLoc: FileLocation = {filePath: '/repo/src/c.ts', startLine: 3, endLine: 3} as any;

    fixture.componentInstance.firstLocations = [firstLoc];
    fixture.componentInstance.secondLocations = [secondLoc];
    fixture.componentInstance.thirdLocations = [thirdLoc];
    fixture.detectChanges();

    rows = fixture.debugElement.queryAll(By.css('tr[sigridFindingNavigator]'));
    const firstRow = rows[0]!;
    const secondRow = rows[1]!;
    const thirdRow = rows[2]!;

    const focusSpy1 = vi.spyOn(firstRow.nativeElement, 'focus');
    const focusSpy2 = vi.spyOn(secondRow.nativeElement, 'focus');
    const focusSpy3 = vi.spyOn(thirdRow.nativeElement, 'focus');
    const blurSpy = vi.spyOn(secondRow.nativeElement, 'blur');

    secondRow.triggerEventHandler('keydown', keydownEvent('ArrowDown'));
    expect(focusSpy3).toHaveBeenCalledTimes(1);

    secondRow.triggerEventHandler('keydown', keydownEvent('ArrowUp'));
    expect(focusSpy1).toHaveBeenCalledTimes(1);

    secondRow.triggerEventHandler('keydown', keydownEvent('Home'));
    expect(focusSpy1).toHaveBeenCalledTimes(2);

    secondRow.triggerEventHandler('keydown', keydownEvent('End'));
    expect(focusSpy3).toHaveBeenCalledTimes(2);
    expect(focusSpy2).toHaveBeenCalledTimes(0);

    secondRow.triggerEventHandler('keydown', keydownEvent('Escape'));
    expect(blurSpy).toHaveBeenCalledTimes(1);

    secondRow.triggerEventHandler('keydown', keydownEvent('Enter'));
    expect(openFile).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledWith(secondLoc);

    secondRow.triggerEventHandler('keydown', keydownEvent(' '));
    expect(openFile).toHaveBeenCalledTimes(2);
    expect(openFile).toHaveBeenLastCalledWith(secondLoc);
  });

  it('prevents default and does nothing when locations is undefined/null/empty', () => {
    fixture.componentInstance.firstLocations = undefined;
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    const e1 = dblClickEvent();
    hostDe.triggerEventHandler('dblclick', e1);
    expect(e1.preventDefault).toHaveBeenCalledTimes(1);
    expect(openFile).not.toHaveBeenCalled();
    expect(overlay.create).not.toHaveBeenCalled();

    fixture.componentInstance.firstLocations = null;
    fixture.detectChanges();

    const e2 = dblClickEvent();
    hostDe.triggerEventHandler('dblclick', e2);
    expect(e2.preventDefault).toHaveBeenCalledTimes(1);
    expect(openFile).not.toHaveBeenCalled();
    expect(overlay.create).not.toHaveBeenCalled();

    fixture.componentInstance.firstLocations = [];
    fixture.detectChanges();

    const e3 = dblClickEvent();
    hostDe.triggerEventHandler('dblclick', e3);
    expect(e3.preventDefault).toHaveBeenCalledTimes(1);
    expect(openFile).not.toHaveBeenCalled();
    expect(overlay.create).not.toHaveBeenCalled();
  });

  it('opens the file directly when exactly one location is provided', () => {
    const loc: FileLocation = {filePath: '/repo/src/a.ts', startLine: 10, endLine: 12} as any;

    fixture.componentInstance.firstLocations = [loc];
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    const e = dblClickEvent();
    hostDe.triggerEventHandler('dblclick', e);

    expect(e.preventDefault).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledWith(loc);
    expect(overlay.create).not.toHaveBeenCalled();
  });

  it('with multiple locations it creates an overlay, attaches popup, and sets menu items', () => {
    fixture.componentInstance.firstLocations = [
      {filePath: '/repo/src/a.ts', startLine: 0, endLine: 0} as any,
      {filePath: '/repo/src/b.ts', startLine: 5, endLine: 6} as any,
    ];
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    hostDe.triggerEventHandler('dblclick', dblClickEvent());

    expect(overlay.position).toHaveBeenCalledTimes(1);
    expect(overlay.create).toHaveBeenCalledTimes(1);
    expect(overlayRef.attach).toHaveBeenCalledTimes(1);

    const componentRef = overlayRef.attach.mock.results[0]!.value as {
      setInput: ReturnType<typeof vi.fn>;
      instance: {close: Subject<void>};
    };

    const calls = componentRef.setInput.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0]![0]).toBe('items');

    const items = calls[0]![1] as Array<{label: string; description?: string; action: () => void}>;
    expect(items.length).toBe(2);
    expect(typeof items[0]!.action).toBe('function');
    expect(typeof items[1]!.action).toBe('function');
  });

  it('backdrop click closes popup (disposes overlay)', () => {
    fixture.componentInstance.firstLocations = [
      {filePath: '/repo/src/a.ts', startLine: 1, endLine: 1} as any,
      {filePath: '/repo/src/b.ts', startLine: 2, endLine: 2} as any,
    ];
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    hostDe.triggerEventHandler('dblclick', dblClickEvent());
    expect(overlayRef.dispose).not.toHaveBeenCalled();

    backdropClick$.next(new MouseEvent('click'));
    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('popup close event closes popup (disposes overlay)', () => {
    fixture.componentInstance.firstLocations = [
      {filePath: '/repo/src/a.ts', startLine: 1, endLine: 1} as any,
      {filePath: '/repo/src/b.ts', startLine: 2, endLine: 2} as any,
    ];
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    hostDe.triggerEventHandler('dblclick', dblClickEvent());
    expect(overlayRef.dispose).not.toHaveBeenCalled();

    popupClose$.next();
    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('double-clicking again while popup is open closes it (toggle)', () => {
    fixture.componentInstance.firstLocations = [
      {filePath: '/repo/src/a.ts', startLine: 1, endLine: 1} as any,
      {filePath: '/repo/src/b.ts', startLine: 2, endLine: 2} as any,
    ];
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    hostDe.triggerEventHandler('dblclick', dblClickEvent());
    expect(overlay.create).toHaveBeenCalledTimes(1);
    expect(overlayRef.dispose).toHaveBeenCalledTimes(0);

    hostDe.triggerEventHandler('dblclick', dblClickEvent());
    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
    expect(overlay.create).toHaveBeenCalledTimes(1);
  });

  it('menu item action opens file and closes popup', () => {
    const locA: FileLocation = {filePath: '/repo/src/a.ts', startLine: 0, endLine: 0} as any;
    const locB: FileLocation = {filePath: '/repo/src/b.ts', startLine: 5, endLine: 6} as any;

    fixture.componentInstance.firstLocations = [locA, locB];
    fixture.detectChanges();
    hostDe = fixture.debugElement.query(By.css('tr[sigridFindingNavigator]'));

    hostDe.triggerEventHandler('dblclick', dblClickEvent());

    const componentRef = overlayRef.attach.mock.results[0]!.value as {
      setInput: ReturnType<typeof vi.fn>;
      instance: {close: Subject<void>};
    };

    const items = componentRef.setInput.mock.calls[0]![1] as Array<{action: () => void}>;
    items[1]!.action();

    expect(openFile).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledWith(locB);
    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });
});
