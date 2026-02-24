import {Component, input, OnInit, output} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'sigrid-select-button',
  imports: [],
  templateUrl: './select-button.html',
  styleUrl: './select-button.scss',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: SelectButton, multi: true}
  ]
})
export class SelectButton implements OnInit, ControlValueAccessor {
  options = input<any[]>([]);
  optionLabel = input<string>('label');
  optionValue = input<string>('value');
  change = output<any>();
  protected value: any;
  protected isDisabled = false;


  // Callbacks provided by Angular forms
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.value = this.options()[0]?.[this.optionValue()];
  }

  writeValue(obj: any): void {
    this.value = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected select(item: any) {
    const value = item[this.optionValue()];
    this.value = value;
    this.change.emit(value);
    console.log(this.value);
  }
}
