import * as vscode from 'vscode';
import { MetadataTreeItem } from './metadata-tree-item';
import { fetchSystemMetadata, validateConfiguration, SystemMetadata } from '../utilities/metadata-api';

type MetadataState = 'loading' | 'loaded' | 'error';

export class MetadataTreeProvider implements vscode.TreeDataProvider<MetadataTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MetadataTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private state: MetadataState = 'loading';
  private metadata: SystemMetadata | null = null;
  private errorMessage = '';

  constructor(
    private apiKey: string | undefined,
    private sigridUrl: string,
    private portfolio: string | undefined,
    private system: string | undefined
  ) {}

  updateConfiguration(
    apiKey: string | undefined,
    sigridUrl: string,
    portfolio: string | undefined,
    system: string | undefined
  ): void {
    this.apiKey = apiKey;
    this.sigridUrl = sigridUrl;
    this.portfolio = portfolio;
    this.system = system;
  }

  refresh(): void {
    this.state = 'loading';
    this.metadata = null;
    this.errorMessage = '';
    this._onDidChangeTreeData.fire(undefined);
    void this.loadMetadata();
  }

  private async loadMetadata(): Promise<void> {
    const validation = validateConfiguration(this.apiKey, this.portfolio, this.system);

    if (!validation.valid) {
      this.state = 'error';
      this.errorMessage = validation.message || 'Invalid configuration';
      this._onDidChangeTreeData.fire(undefined);
      return;
    }

    try {
      console.log(`[Metadata] Fetching from ${this.sigridUrl} for ${this.portfolio}/${this.system}`);
      this.metadata = await fetchSystemMetadata(
        this.apiKey!,
        this.sigridUrl,
        this.portfolio!,
        this.system!
      );
      console.log('[Metadata] Successfully loaded:', this.metadata);
      this.state = 'loaded';
      this.errorMessage = '';
    } catch (error) {
      this.state = 'error';
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Metadata] Error loading metadata:', error);
    } finally {
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  getTreeItem(element: MetadataTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootChildren());
    }

    if (element.type === 'category' && this.metadata) {
      const label = typeof element.label === 'string' ? element.label : element.label?.label || '';
      return Promise.resolve(this.getCategoryChildren(label));
    }

    return Promise.resolve([]);
  }

  private getRootChildren(): MetadataTreeItem[] {
    if (this.state === 'loading') {
      return [new MetadataTreeItem('Loading metadata...', 'loading')];
    }

    if (this.state === 'error') {
      const items = [
        new MetadataTreeItem(`⚠ ${this.errorMessage}`, 'error'),
      ];

      if (this.errorMessage.includes('not configured')) {
        items.push(
          new MetadataTreeItem('Click to open settings', 'action', vscode.TreeItemCollapsibleState.None, {
            command: 'workbench.action.openSettings',
          })
        );
      } else {
        items.push(
          new MetadataTreeItem('Retry', 'action', vscode.TreeItemCollapsibleState.None, {
            command: 'sigrid-vscode.refreshMetadata',
          })
        );
      }

      return items;
    }

    if (!this.metadata) {
      return [new MetadataTreeItem('No metadata loaded', 'error')];
    }

    return [
      new MetadataTreeItem('General', 'category', vscode.TreeItemCollapsibleState.Expanded),
      new MetadataTreeItem('Status', 'category', vscode.TreeItemCollapsibleState.Expanded),
      new MetadataTreeItem('External Reference', 'category', vscode.TreeItemCollapsibleState.Collapsed),
      new MetadataTreeItem('Metadata', 'category', vscode.TreeItemCollapsibleState.Expanded),
      new MetadataTreeItem('Edit Metadata in Sigrid', 'action', vscode.TreeItemCollapsibleState.None, {
        command: 'sigrid-vscode.openMetadataEditor',
      }),
    ];
  }

  private getCategoryChildren(categoryLabel: string): MetadataTreeItem[] {
    if (!this.metadata) {
      return [];
    }

    let section: Record<string, string | boolean> | null = null;

    if (categoryLabel === 'General') {
      section = this.metadata.general;
    } else if (categoryLabel === 'Status') {
      section = this.metadata.status;
    } else if (categoryLabel === 'External Reference') {
      section = this.metadata.externalReference;
    } else if (categoryLabel === 'Metadata') {
      section = this.metadata.metadata;
    }

    if (!section) {
      return [];
    }

    return Object.entries(section).map(
      ([key, value]) =>
        new MetadataTreeItem('', 'keyValue', vscode.TreeItemCollapsibleState.None, { key, value })
    );
  }
}
