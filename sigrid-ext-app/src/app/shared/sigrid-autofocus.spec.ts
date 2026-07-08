import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {describe, expect, it, vi} from 'vitest';
import {SigridAutofocus} from './sigrid-autofocus';

@Component({
  standalone: true,
  imports: [SigridAutofocus],
  template: `<input sigridAutofocus />`,
})
class HostComponent {}

describe('SigridAutofocus', () => {
  it('should call focus() on the host element after view init', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const focusSpy = vi.spyOn(input, 'focus');

    fixture.detectChanges();

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });
});
