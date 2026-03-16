import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Overlay} from '@angular/cdk/overlay';
import {Subject} from 'rxjs';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {SigridDialog} from './sigrid-dialog';
import {DialogRef} from './dialog-ref';

@Component({
  standalone: true,
  template: `<div>Dialog content</div>`,
})
class TestDialogContentComponent {
  title?: string;
  count?: number;
}

describe('SigridDialog', () => {
  let service: SigridDialog;

  let backdropClick$: Subject<MouseEvent>;
  let keydownEvents$: Subject<KeyboardEvent>;

  const componentRef = {
    setInput: vi.fn(),
  };

  const dialogComponentRef = {
    instance: {
      outlet: {
        attach: vi.fn(() => componentRef),
      },
    },
  };

  const overlayRef = {
    attach: vi.fn(() => dialogComponentRef),
    backdropClick: vi.fn(() => backdropClick$.asObservable()),
    keydownEvents: vi.fn(() => keydownEvents$.asObservable()),
    dispose: vi.fn(),
  };

  const positionStrategy = {};
  const globalPositionStrategy = {
    centerHorizontally: vi.fn(() => ({
      centerVertically: vi.fn(() => positionStrategy),
    })),
  };

  const positionBuilder = {
    global: vi.fn(() => globalPositionStrategy),
  };

  const scrollStrategy = {};
  const overlay = {
    create: vi.fn(() => overlayRef),
    position: vi.fn(() => positionBuilder),
    scrollStrategies: {
      block: vi.fn(() => scrollStrategy),
    },
  };

  beforeEach(() => {
    backdropClick$ = new Subject<MouseEvent>();
    keydownEvents$ = new Subject<KeyboardEvent>();

    componentRef.setInput.mockClear();
    dialogComponentRef.instance.outlet.attach.mockClear();

    overlayRef.attach.mockClear();
    overlayRef.backdropClick.mockClear();
    overlayRef.keydownEvents.mockClear();
    overlayRef.dispose.mockClear();

    overlay.create.mockClear();
    overlay.position.mockClear();
    overlay.scrollStrategies.block.mockClear();
    positionBuilder.global.mockClear();
    globalPositionStrategy.centerHorizontally.mockClear();

    TestBed.configureTestingModule({
      imports: [TestDialogContentComponent],
      providers: [{provide: Overlay, useValue: overlay}],
    });

    service = TestBed.inject(SigridDialog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('open() should create the overlay, attach the dialog, and return a DialogRef', () => {
    const dialogRef = service.open(TestDialogContentComponent, {
      title: 'Hello',
      count: 3,
    });

    expect(dialogRef).toBeInstanceOf(DialogRef);

    expect(overlay.scrollStrategies.block).toHaveBeenCalledTimes(1);
    expect(overlay.position).toHaveBeenCalledTimes(1);
    expect(positionBuilder.global).toHaveBeenCalledTimes(1);
    expect(globalPositionStrategy.centerHorizontally).toHaveBeenCalledTimes(1);
    expect(overlay.create).toHaveBeenCalledTimes(1);

    expect(overlay.create).toHaveBeenCalledWith({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      scrollStrategy: scrollStrategy,
      positionStrategy: positionStrategy,
    });

    expect(overlayRef.attach).toHaveBeenCalledTimes(1);
    expect(dialogComponentRef.instance.outlet.attach).toHaveBeenCalledTimes(1);

    expect(componentRef.setInput).toHaveBeenCalledTimes(2);
    expect(componentRef.setInput).toHaveBeenCalledWith('title', 'Hello');
    expect(componentRef.setInput).toHaveBeenCalledWith('count', 3);

    expect(overlayRef.backdropClick).toHaveBeenCalledTimes(1);
    expect(overlayRef.keydownEvents).toHaveBeenCalledTimes(1);
  });

  it('open() should not set inputs when no data is provided', () => {
    service.open(TestDialogContentComponent);

    expect(componentRef.setInput).not.toHaveBeenCalled();
  });

  it('should dispose the overlay on backdrop click', () => {
    service.open(TestDialogContentComponent);

    expect(overlayRef.dispose).not.toHaveBeenCalled();

    backdropClick$.next(new MouseEvent('click'));

    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('should dispose the overlay on Escape keydown', () => {
    service.open(TestDialogContentComponent);

    keydownEvents$.next(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('should dispose the overlay on Esc keydown', () => {
    service.open(TestDialogContentComponent);

    keydownEvents$.next(new KeyboardEvent('keydown', {key: 'Esc'}));

    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('should ignore non-escape keydown events', () => {
    service.open(TestDialogContentComponent);

    keydownEvents$.next(new KeyboardEvent('keydown', {key: 'Enter'}));

    expect(overlayRef.dispose).not.toHaveBeenCalled();
  });

  it('returned DialogRef.close() should dispose the overlay', () => {
    const dialogRef = service.open(TestDialogContentComponent);

    dialogRef.close();

    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
  });
});
