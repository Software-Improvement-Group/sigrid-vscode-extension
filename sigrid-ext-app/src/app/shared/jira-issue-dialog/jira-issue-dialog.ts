import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogRef} from '../dialog/dialog-ref';
import {IconButton} from '../icon-button/icon-button';
import {FindingSelection} from '../../services/finding-selection';
import {VsCode} from '../../services/vs-code';
import {SigridConfiguration} from '../../services/sigrid-configuration';
import {JiraFinding} from '../../models/create-jira-issue-payload';
import {getSeverityEmoji} from '../../utilities/severity-emoji';
import {SIGRID_DEFAULT_URL} from '../../utilities/constants';

@Component({
  selector: 'sigrid-jira-issue-dialog',
  imports: [
    ReactiveFormsModule,
    IconButton,
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
    const config = this.sigridConfig.getConfigurationOrEmpty();
    const sigridUrl = config.sigridUrl || SIGRID_DEFAULT_URL;
    const systemUrl = `${sigridUrl}/${config.customer}/${config.system}`;

    const findings: JiraFinding[] = this.selectionService.getAll().map(f => ({
      emoji: getSeverityEmoji(f.severity),
      title: f.title,
      fileLocations: f.fileLocations.map(loc => ({
        filePath: loc.filePath,
        startLine: loc.startLine,
      })),
    }));

    this.vscode.createJiraIssue({title, findings, sigridUrl: systemUrl});
    this.selectionService.clear();
    this.dialogRef.close();
  }

  protected close() {
    this.dialogRef.close();
  }
}
