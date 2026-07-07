import {Component, effect, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogRef} from '../dialog/dialog-ref';
import {IconButton} from '../icon-button/icon-button';
import {FindingSelection} from '../../services/finding-selection';
import {VsCode} from '../../services/vs-code';
import {SigridConfiguration} from '../../services/sigrid-configuration';
import {AzureDevOpsWorkItemTypes} from '../../services/azure-devops-work-item-types';
import {IssueFinding} from '../../models/issue-finding';
import {getSeverityEmoji} from '../../utilities/severity-emoji';
import {SIGRID_DEFAULT_URL} from '../../utilities/constants';

@Component({
  selector: 'sigrid-azure-devops-work-item-dialog',
  imports: [
    ReactiveFormsModule,
    IconButton,
  ],
  templateUrl: './azure-devops-work-item-dialog.html',
  styleUrl: './azure-devops-work-item-dialog.scss',
})
export class AzureDevOpsWorkItemDialog {
  private dialogRef = inject(DialogRef);
  private selectionService = inject(FindingSelection);
  private vscode = inject(VsCode);
  private sigridConfig = inject(SigridConfiguration);
  protected workItemTypesService = inject(AzureDevOpsWorkItemTypes);

  protected readonly selectedCount = this.selectionService.selectedCount;
  protected readonly types = this.workItemTypesService.types;
  protected readonly loading = this.workItemTypesService.loading;
  protected readonly error = this.workItemTypesService.error;

  protected workItemForm = new FormGroup({
    title: new FormControl('', Validators.required),
    workItemType: new FormControl('', Validators.required),
  });

  constructor() {
    const config = this.sigridConfig.getConfigurationOrEmpty();
    this.workItemTypesService.requestIfNeeded(config.azureDevOpsOrganizationUrl, config.azureDevOpsProjectName);

    effect(() => {
      const types = this.types();
      if (!types || types.length === 0 || this.workItemForm.controls.workItemType.value) {
        return;
      }

      const lastSelected = this.workItemTypesService.getLastSelectedType();
      const defaultType = lastSelected && types.includes(lastSelected)
        ? lastSelected
        : types.includes('Task') ? 'Task' : types[0];
      this.workItemForm.controls.workItemType.setValue(defaultType);
    });
  }

  protected onSubmit() {
    if (!this.workItemForm.valid) {
      return;
    }

    const title = this.workItemForm.controls.title.value ?? '';
    const workItemType = this.workItemForm.controls.workItemType.value ?? '';
    const config = this.sigridConfig.getConfigurationOrEmpty();
    const sigridUrl = config.sigridUrl || SIGRID_DEFAULT_URL;
    const systemUrl = `${sigridUrl}/${config.customer}/${config.system}`;

    const findings: IssueFinding[] = this.selectionService.getAll().map(f => ({
      emoji: getSeverityEmoji(f.severity),
      title: f.title,
      fileLocations: f.fileLocations.map(loc => ({
        filePath: loc.filePath,
        startLine: loc.startLine,
      })),
    }));

    this.vscode.createAzureDevOpsWorkItem({title, workItemType, findings, sigridUrl: systemUrl});
    this.workItemTypesService.setLastSelectedType(workItemType);
    this.selectionService.clear();
    this.dialogRef.close();
  }

  protected close() {
    this.dialogRef.close();
  }
}
