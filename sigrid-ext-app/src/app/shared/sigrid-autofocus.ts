import {AfterViewInit, Directive, ElementRef, inject} from '@angular/core';

@Directive({
  selector: '[sigridAutofocus]',
})
export class SigridAutofocus implements AfterViewInit {
  private el = inject(ElementRef<HTMLElement>);

  ngAfterViewInit() {
    this.el.nativeElement.focus();
  }
}
