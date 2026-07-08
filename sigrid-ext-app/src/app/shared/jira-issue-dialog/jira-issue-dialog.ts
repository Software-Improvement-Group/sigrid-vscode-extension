import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogRef} from '../dialog/dialog-ref';
import {IconButton} from '../icon-button/icon-button';
import {FindingSelection} from '../../services/finding-selection';
import {VsCode} from '../../services/vs-code';
import {SigridConfiguration} from '../../services/sigrid-configuration';
import {buildIssuePayloadBase} from '../../utilities/issue-payload';
import {SigridAutofocus} from '../sigrid-autofocus';

@Component({
  selector: 'sigrid-jira-issue-dialog',
  imports: [
    ReactiveFormsModule,
    IconButton,
    SigridAutofocus,
  ],
  templateUrl: './jira-issue-dialog.html',
  styleUrl: './jira-issue-dialog.scss',
})
export class JiraIssueDialog {
  private dialogRef = inject(DialogRef);
  private selectionService = inject(FindingSelection);
  private vscode = inject(VsCode);
  private sigridConfig = inject(SigridConfiguration);

  protected readonly selectedCount = this.selectionService.selectedCount;

  protected jiraForm = new FormGroup({
    title: new FormControl('', Validators.required),
  });

  protected onSubmit() {
    if (!this.jiraForm.valid) {
      return;
    }

    const title = this.jiraForm.controls.title.value ?? '';
    const {findings, sigridUrl} = buildIssuePayloadBase(this.selectionService, this.sigridConfig);

    this.vscode.createJiraIssue({title, findings, sigridUrl});
    this.selectionService.clear();
    this.dialogRef.close();
  }

  protected close() {
    this.dialogRef.close();
  }
}
