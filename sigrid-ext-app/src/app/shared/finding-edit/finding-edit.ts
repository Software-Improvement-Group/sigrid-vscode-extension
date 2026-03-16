import {Component, computed, inject, input, OnInit} from '@angular/core';
import {SecurityFinding} from '../../models/security-finding';
import {RefactoringCandidate} from '../../models/refactoring-candidate';
import {FindingStatus, MaintainabilityFindingStatus} from '../../models/finding-status';
import {snakeCaseToSentenceCase} from '../../utilities/string';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SigridApi} from '../../services/sigrid-api';
import {DialogRef} from '../dialog/dialog-ref';
import {IconButton} from '../icon-button/icon-button';
import {VsCode} from '../../services/vs-code';
import {VsMessageSeverity} from '../../models/vs-message-data';

@Component({
  selector: 'sigrid-finding-edit',
  imports: [
    ReactiveFormsModule,
    IconButton
  ],
  templateUrl: './finding-edit.html',
  styleUrl: './finding-edit.scss',
})
export class FindingEdit implements OnInit {
  finding = input.required<RefactoringCandidate | SecurityFinding>();

  private sigridApi = inject(SigridApi);
  private dialogRef = inject(DialogRef);
  private vscode = inject(VsCode);

  protected statusOptions = computed(() => {
    const finding = this.finding();
    const enumValues: string[] = finding instanceof RefactoringCandidate
      ? Object.values(MaintainabilityFindingStatus) : Object.values(FindingStatus);

    return enumValues.map(value => ({value, label: snakeCaseToSentenceCase(value)}));
  });

  protected findingEditForm = new FormGroup({
    status: new FormControl('', Validators.required),
    remark: new FormControl(''),
  });

  ngOnInit() {
    const finding = this.finding();
    this.findingEditForm.controls.status.setValue(finding.status);
    // todo: API doesn't return the remark field yet
    // this.findingEditForm.controls.remark.setValue(finding.remark)
  }

  protected onSave() {
    if (!this.findingEditForm.valid) {
      return;
    }

    const finding = this.finding();
    console.log(this.findingEditForm.value);
    this.sigridApi.editFinding(finding.id, {
      status: this.findingEditForm.controls.status.value ?? '',
      /*
       todo: Reset remark to undefined to keep the remark if not specified.
       Remove this reset once the API returns the remark field and it will be loaded in the form.
      */
      remark: this.findingEditForm.controls.remark.value ?? undefined
    }).subscribe({
      next: () => {
        this.dialogRef.close({
          id: finding.id,
          status: this.findingEditForm.controls.status.value ?? '',
          remark: this.findingEditForm.controls.remark.value
        });
      },
      error: (error) => {
        console.error('Error updating finding:', error);
        this.vscode.showMessage('Error occurred while updating finding.', VsMessageSeverity.Error);
      }
    });
  }

  protected close() {
    this.dialogRef.close();
  }
}
