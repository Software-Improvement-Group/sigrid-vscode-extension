import {Component, input, OnInit, output} from '@angular/core';

@Component({
  selector: 'sigrid-select-button',
  imports: [],
  templateUrl: './select-button.html',
  styleUrl: './select-button.scss',
})
export class SelectButton implements OnInit {
  options = input<any[]>([]);
  optionLabel = input<string>('label');
  optionValue = input<string>('value');
  change = output<any>();
  protected value: any;

  ngOnInit() {
    this.value = this.options()[0]?.[this.optionValue()];
  }

  protected select(item: any) {
    const value = item[this.optionValue()];
    this.value = value;
    this.change.emit(value);
  }
}
