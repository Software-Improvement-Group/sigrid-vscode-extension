import {Directive, ElementRef} from '@angular/core';
import {FocusableOption} from '@angular/cdk/a11y';

@Directive({
  selector: '[sigridFocusable]',
})
export class SigridFocusable implements FocusableOption {
  constructor(private element: ElementRef<HTMLElement>) {}

  focus(): void {
    console.log(this.element);
    this.element.nativeElement.focus();
  }
}
