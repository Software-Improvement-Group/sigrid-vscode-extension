import * as vscode from 'vscode';

export type MetadataTreeItemType = 'category' | 'keyValue' | 'action' | 'loading' | 'error';

export class MetadataTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly type: MetadataTreeItemType,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly data?: { key?: string; value?: string | boolean; command?: string }
  ) {
    super(label, collapsibleState);

    if (type === 'category') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (type === 'keyValue') {
      this.iconPath = new vscode.ThemeIcon('symbol-field');
      if (data?.key && data?.value !== undefined) {
        this.label = `${this.formatKey(data.key)}: ${this.formatValue(data.value)}`;
        this.tooltip = `${this.formatKey(data.key)}: ${this.formatValue(data.value)}`;
      }
    } else if (type === 'action') {
      this.iconPath = new vscode.ThemeIcon('link-external');
      this.command = {
        command: data?.command || 'sigrid-vscode.openMetadataEditor',
        title: label,
      };
    } else if (type === 'loading') {
      this.iconPath = new vscode.ThemeIcon('loading~spin');
    } else if (type === 'error') {
      this.iconPath = new vscode.ThemeIcon('error');
      this.tooltip = label;
    }
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: string | boolean): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value || '—';
  }
}
