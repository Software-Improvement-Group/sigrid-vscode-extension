import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class FindingTreeItem extends TreeItem {
    constructor(id: string, label: string, collapsibleState: TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.iconPath = id?.indexOf(".") !== -1 ? ThemeIcon.File : ThemeIcon.Folder;
        this.description = "This is a finding description.";
        this.id = id;
    }
}