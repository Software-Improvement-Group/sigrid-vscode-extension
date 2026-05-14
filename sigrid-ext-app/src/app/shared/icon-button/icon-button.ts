import {Component, input, output} from '@angular/core';
import {SvgIcon} from '../svg-icon/svg-icon';

@Component({
  selector: 'sigrid-icon-button',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
  imports: [
    SvgIcon
  ]
})
export class IconButton {
  iconClass = input<string>();
  svgIcon = input<string>();
  disabled = input(false);
  onClick = output<void>();

  protected onButtonClick() {
    if (!this.disabled()) {
      this.onClick.emit();
    }
  }
}
