import {ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {CdkPortalOutlet} from '@angular/cdk/portal';

@Component({
  selector: 'sigrid-dialog',
  imports: [
    CdkPortalOutlet
  ],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dialog {
  @ViewChild(CdkPortalOutlet, { static: true })
  outlet!: CdkPortalOutlet;
}
