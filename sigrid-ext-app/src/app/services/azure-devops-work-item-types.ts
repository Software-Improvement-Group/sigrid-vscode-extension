import {inject, Injectable, signal} from '@angular/core';
import {VsCode} from './vs-code';
import {AZURE_DEVOPS_LAST_WORK_ITEM_TYPE} from '../utilities/storage-keys';

@Injectable({
  providedIn: 'root',
})
export class AzureDevOpsWorkItemTypes {
  private vscode = inject(VsCode);
  private fetchedKey: string | null = null;

  readonly types = signal<string[] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  requestIfNeeded(organizationUrl: string, projectName: string) {
    const key = `${organizationUrl}|${projectName}`;
    if (this.fetchedKey === key && this.types() !== null) {
      return;
    }

    this.fetchedKey = key;
    this.types.set(null);
    this.error.set(null);
    this.loading.set(true);
    this.vscode.getAzureDevOpsWorkItemTypes();
  }

  onLoaded(types: string[]) {
    this.loading.set(false);
    this.error.set(null);
    this.types.set(types);
  }

  onError(message: string) {
    this.loading.set(false);
    this.error.set(message);
    this.types.set(null);
    this.fetchedKey = null;
  }

  getLastSelectedType(): string | null {
    return localStorage.getItem(AZURE_DEVOPS_LAST_WORK_ITEM_TYPE);
  }

  setLastSelectedType(type: string) {
    localStorage.setItem(AZURE_DEVOPS_LAST_WORK_ITEM_TYPE, type);
  }
}
