import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogRef} from '../dialog/dialog-ref';
import {IconButton} from '../icon-button/icon-button';
import {FindingSelectionService, SelectedFinding} from '../../services/finding-selection';
import {VsCode} from '../../services/vs-code';
import {SigridConfiguration} from '../../services/sigrid-configuration';
import {RiskSeverity} from '../../models/risk-severity';
import {MaintainabilitySeverity} from '../../models/maintainability-severity';
import {JiraFinding} from '../../models/create-jira-issue-payload';

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
  private selectionService = inject(FindingSelectionService);
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
    const sigridUrl = config.sigridUrl || 'https://sigrid-says.com';
    const systemUrl = `${sigridUrl}/${config.customer}/${config.system}`;

    const findings: JiraFinding[] = this.selectionService.getAll().map(f => ({
      emoji: this.severityEmoji(f.severity),
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

  private severityEmoji(severity: string | RiskSeverity | MaintainabilitySeverity): string {
    if (typeof severity !== 'string') {
      if (severity === RiskSeverity.Critical || severity === RiskSeverity.High
        || severity === MaintainabilitySeverity.VeryHigh || severity === MaintainabilitySeverity.High) {
        return '\u{1F534}';
      }
      if (severity === RiskSeverity.Medium || severity === MaintainabilitySeverity.Medium
        || severity === MaintainabilitySeverity.Moderate) {
        return '\u{1F7E0}';
      }
      if (severity === RiskSeverity.Low || severity === MaintainabilitySeverity.Low) {
        return '\u{1F7E1}';
      }
      return '\u26AA';
    }

    const s = severity.toLowerCase();
    if (s === 'critical' || s === 'high') {
      return '\u{1F534}';
    }
    if (s === 'medium' || s === 'moderate') {
      return '\u{1F7E0}';
    }
    if (s === 'low') {
      return '\u{1F7E1}';
    }
    return '\u26AA';
  }
}
