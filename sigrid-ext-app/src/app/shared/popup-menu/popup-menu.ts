import {AfterViewInit, Component, input, output, QueryList, ViewChildren} from '@angular/core';
import {MenuItem} from './menu-item';
import {CdkTrapFocus, FocusKeyManager} from '@angular/cdk/a11y';
import {SigridFocusable} from '../sigrid-focusable';

@Component({
  selector: 'sigrid-popup-menu',
  imports: [
    SigridFocusable,
    CdkTrapFocus
  ],
  templateUrl: './popup-menu.html',
  styleUrl: './popup-menu.scss',
})
export class PopupMenu implements AfterViewInit {
  items = input<MenuItem[]>([]);
  close = output<void>();
  @ViewChildren(SigridFocusable) menuItems!: QueryList<SigridFocusable>;
  keyManager!: FocusKeyManager<SigridFocusable>;

  ngAfterViewInit() {
    this.keyManager = new FocusKeyManager(this.menuItems).withWrap();
    this.keyManager.setFirstItemActive();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.keyManager.onKeydown(event);
    } else if (event.key === 'Enter') {
      const activeIndex = this.keyManager.activeItemIndex;
      if (activeIndex !== null && activeIndex !== undefined) {
        this.selectItem(this.items()[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      this.close.emit();
    }
  }

  selectItem(item: MenuItem) {
    if (item.action != null) {
      item.action();
    }
  }

}
