import {Directive, ElementRef} from '@angular/core';
import {FocusableOption} from '@angular/cdk/a11y';

@Directive({
  selector: '[sigridFocusable]',
})
export class SigridFocusable implements FocusableOption {
  constructor(private element: ElementRef<HTMLElement>) {}

  focus(): void {
    this.element.nativeElement.focus();
  }
}
