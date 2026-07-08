import {Component, effect, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogRef} from '../dialog/dialog-ref';
import {IconButton} from '../icon-button/icon-button';
import {FindingSelection} from '../../services/finding-selection';
import {VsCode} from '../../services/vs-code';
import {SigridConfiguration} from '../../services/sigrid-configuration';
import {AzureDevOpsWorkItemTypes} from '../../services/azure-devops-work-item-types';
import {buildIssuePayloadBase} from '../../utilities/issue-payload';
import {SigridAutofocus} from '../sigrid-autofocus';

@Component({
  selector: 'sigrid-azure-devops-work-item-dialog',
  imports: [
    ReactiveFormsModule,
    IconButton,
    SigridAutofocus,
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
    this.workItemTypesService.requestIfNeeded(
      config.azureDevOpsOrganizationUrl, config.azureDevOpsProjectName, config.azureDevOpsPersonalAccessToken
    );

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
    const {findings, sigridUrl} = buildIssuePayloadBase(this.selectionService, this.sigridConfig);

    this.vscode.createAzureDevOpsWorkItem({title, workItemType, findings, sigridUrl});
    this.workItemTypesService.setLastSelectedType(workItemType);
    this.selectionService.clear();
    this.dialogRef.close();
  }

  protected close() {
    this.dialogRef.close();
  }
}
