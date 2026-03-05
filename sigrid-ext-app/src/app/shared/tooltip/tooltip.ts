import {Component, HostBinding, input} from '@angular/core';

@Component({
  selector: 'sigrid-tooltip',
  imports: [],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
})
export class Tooltip {
  content = input('');

  @HostBinding('style.position') position = 'fixed';
  @HostBinding('style.pointerEvents') pointerEvents = 'none';
  @HostBinding('style.top') top = '0px';
  @HostBinding('style.left') left = '0px';

  setPosition(x: number, y: number) {
    this.left = x + 'px'; this.top = y + 'px';
  }
}
