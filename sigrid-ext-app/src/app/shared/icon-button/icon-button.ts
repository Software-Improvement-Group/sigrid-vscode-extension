import {Component, input, output} from '@angular/core';

@Component({
  selector: 'sigrid-icon-button',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
})
export class IconButton {
  iconClass = input.required<string>();
  disabled = input(false);
  onClick = output<void>();

  protected onButtonClick() {
    if (!this.disabled()) {
      this.onClick.emit();
    }
  }
}
