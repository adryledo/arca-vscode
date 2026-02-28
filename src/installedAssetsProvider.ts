/**
 * ARCA - InstalledAssetsProvider
 * VS Code TreeDataProvider for the sidebar panel showing installed assets.
 */
import * as vscode from 'vscode';
import { AssetResolver } from './assetResolver';
import { ArcaAssetEntry } from './types';

export class InstalledAssetsProvider implements vscode.TreeDataProvider<AssetTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<AssetTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private resolver: AssetResolver | undefined;

    constructor() {
        this.refreshWorkspace();
    }

    refresh(): void {
        this.refreshWorkspace();
        this._onDidChangeTreeData.fire();
    }

    private refreshWorkspace(): void {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            this.resolver = new AssetResolver(workspaceRoot);
        } else {
            this.resolver = undefined;
        }
    }

    getTreeItem(element: AssetTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AssetTreeItem): AssetTreeItem[] {
        if (element || !this.resolver) {
            return [];
        }

        const assets = this.resolver.listInstalled();
        if (assets.length === 0) {
            return [new AssetTreeItem('No assets installed', '', '', 'none')];
        }

        return assets.map(a => new AssetTreeItem(
            a.id,
            a.version,
            a.source,
            a.mapping || '',
        ));
    }
}

class AssetTreeItem extends vscode.TreeItem {
    constructor(
        public readonly assetId: string,
        public readonly version: string,
        public readonly source: string,
        public readonly mapping: string,
    ) {
        super(assetId, vscode.TreeItemCollapsibleState.None);

        if (version) {
            this.description = `v${version} (${source})`;
            this.tooltip = `${assetId}@${version}\nSource: ${source}\nMapping: ${mapping || 'none'}`;
            this.iconPath = new vscode.ThemeIcon('file-symlink-file');
        } else {
            this.iconPath = new vscode.ThemeIcon('info');
        }
    }
}
