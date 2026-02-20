import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {describe, expect, it, vi} from 'vitest';
import {SigridFocusable} from './sigrid-focusable';

@Component({
  standalone: true,
  imports: [SigridFocusable],
  template: `<li sigridFocusable tabindex="-1">Item</li>`,
})
class HostComponent {
  @ViewChild(SigridFocusable) focusableDirective!: SigridFocusable;
}

describe('SigridFocusable', () => {
  it('should create the directive instance via DI', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.focusableDirective).toBeTruthy();
  });

  it('focus() should call nativeElement.focus()', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const li: HTMLLIElement | null = fixture.nativeElement.querySelector('li');
    expect(li).toBeTruthy();

    const focusSpy = vi.spyOn(li as HTMLLIElement, 'focus');

    fixture.componentInstance.focusableDirective.focus();

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });
});
