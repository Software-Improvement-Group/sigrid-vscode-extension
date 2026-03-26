import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItemCollapsibleState } from "vscode";
import { FindingTreeItem } from "./finding-tree-item";

export class FindingTreeDataProvider implements TreeDataProvider<FindingTreeItem> {
    private _onDidChangeTreeData: EventEmitter<FindingTreeItem | undefined | void> = new EventEmitter<FindingTreeItem | undefined | void>();
    readonly onDidChangeTreeData: Event<FindingTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: FindingTreeItem): FindingTreeItem {
        return element;
    }

    getChildren(element?: FindingTreeItem | undefined): Thenable<FindingTreeItem[]> {
        if (!element) {
            // Return root-level items
            return Promise.resolve([
                new FindingTreeItem("1", "First Finding", TreeItemCollapsibleState.Collapsed),
                new FindingTreeItem("2", "Second Finding", TreeItemCollapsibleState.Collapsed),
                new FindingTreeItem("3", "Third Finding", TreeItemCollapsibleState.Collapsed)
            ]);
        }

        switch (element.id) {
            case "1":
                return Promise.resolve([
                    new FindingTreeItem("1.1", "Sub-finding 1.1", TreeItemCollapsibleState.None),
                    new FindingTreeItem("1.2", "Sub-finding 1.2", TreeItemCollapsibleState.None)
                ]);
            case "2":
                return Promise.resolve([
                    new FindingTreeItem("2.1", "Sub-finding 2.1", TreeItemCollapsibleState.None),
                    new FindingTreeItem("2.2", "Sub-finding 2.2", TreeItemCollapsibleState.None)
                ]);
            case "3":
                return Promise.resolve([
                    new FindingTreeItem("3.1", "Sub-finding 3.1", TreeItemCollapsibleState.None),
                    new FindingTreeItem("3.2", "Sub-finding 3.2", TreeItemCollapsibleState.None)
                ]);
        }
        // Return child items for the given element
        return Promise.resolve([]);
    }
}