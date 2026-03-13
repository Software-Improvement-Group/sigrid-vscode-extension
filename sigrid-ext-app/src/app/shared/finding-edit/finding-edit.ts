import {Component, computed, inject, input, OnInit} from '@angular/core';
import {SecurityFinding} from '../../models/security-finding';
import {RefactoringCandidate} from '../../models/refactoring-candidate';
import {FindingStatus, MaintainabilityFindingStatus} from '../../models/finding-status';
import {snakeCaseToSentenceCase} from '../../utilities/string';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SigridApi} from '../../services/sigrid-api';
import {DialogRef} from '../dialog/dialog-ref';

@Component({
  selector: 'sigrid-finding-edit',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './finding-edit.html',
  styleUrl: './finding-edit.scss',
})
export class FindingEdit implements OnInit {
  finding = input.required<RefactoringCandidate | SecurityFinding>();

  private sigridApi = inject(SigridApi);
  private dialogRef = inject(DialogRef);

  statusOptions = computed(() => {
    const finding = this.finding();
    const enumValues: string[] = finding instanceof RefactoringCandidate
      ? Object.values(MaintainabilityFindingStatus) : Object.values(FindingStatus);

    return enumValues.map(value => ({value, label: snakeCaseToSentenceCase(value)}));
  });

  findingEditForm = new FormGroup({
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
      remark: this.findingEditForm.controls.remark.value
    }).subscribe({
      next: () => {
        console.log('Finding updated successfully');
        this.dialogRef.close({
          id: finding.id,
          status: this.findingEditForm.controls.status.value ?? '',
          remark: this.findingEditForm.controls.remark.value
        });
      },
      error: (error) => {
        console.error('Error updating finding:', error);
      }
    });
  }
}
