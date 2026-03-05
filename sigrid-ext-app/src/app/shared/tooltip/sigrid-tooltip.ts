import {
  ComponentRef,
  Directive,
  ElementRef, HostListener,
  inject,
  Injector,
  input,
  ViewContainerRef
} from '@angular/core';
import {Tooltip} from './tooltip';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[sigridTooltip]',
})
export class SigridTooltip {
  content = input('', {alias: 'sigridTooltip'});
  tooltipPosition = input<TooltipPosition>('bottom');
  tooltipDelay = input(100);

  private tooltipRef?: ComponentRef<Tooltip>;
  private showTimeout?: any;

  private readonly elementRef = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly vcr = inject(ViewContainerRef);

  @HostListener('mouseenter') onMouseEnter() {
    this.showTimeout = setTimeout(() => this.showTooltip(), this.tooltipDelay());
  }

  @HostListener('mouseleave') onMouseLeave() {
    clearTimeout(this.showTimeout);
    this.hideTooltip();
  }

  private showTooltip() {
    if (this.tooltipRef) return;
    this.tooltipRef = this.vcr.createComponent(Tooltip, {injector: this.injector});
    this.tooltipRef.instance.content = this.content;
    const domElem = (this.tooltipRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);
    this.updatePosition();
  }

  private hideTooltip() {
    if (!this.tooltipRef) return;
    this.tooltipRef.destroy();
    this.tooltipRef = undefined;
  }

  private updatePosition() {
    if (!this.tooltipRef) return;
    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipEl = (this.tooltipRef.hostView as any).rootNodes[0] as HTMLElement;
    const tooltipRect = tooltipEl.getBoundingClientRect();
    let x = 0;
    let y = 0;
    switch (this.tooltipPosition()) {
      case 'top':
        x = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        y = hostRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        y = hostRect.bottom + 8;
        break;
      case 'left':
        x = hostRect.left - tooltipRect.width - 8;
        y = hostRect.top + hostRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = hostRect.right + 8;
        y = hostRect.top + hostRect.height / 2 - tooltipRect.height / 2;
        break;
    }
    this.tooltipRef.instance.setPosition(x, y);
  }
}
