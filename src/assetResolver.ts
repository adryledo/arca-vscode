import { CliRunner } from './cliRunner';
import {
    ArcaAssetEntry, ResolvedAsset, RemoteAssetInfo, AssetKind,
} from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ResolveProgress {
    onAssetStart?: (id: string, version: string) => void;
    onAssetDone?: (id: string, version: string) => void;
    onAssetError?: (id: string, error: string) => void;
}

export class AssetResolver {
    private cli: CliRunner;

    constructor(private workspaceRoot: string, cli?: CliRunner) {
        this.cli = cli || new CliRunner(workspaceRoot);
    }

    // ---- List Remote ----

    /** List assets from a remote source URL, optionally filtered by kind. */
    async listRemote(url: string, kindFilter?: AssetKind): Promise<RemoteAssetInfo[]> {
        const args = ['list-remote', `"${url}"`, '--json'];
        const result = this.cli.run(args);

        let assets: RemoteAssetInfo[] = [];
        const rawAssets = result.Assets || result.assets || result;

        if (typeof rawAssets === 'object' && !Array.isArray(rawAssets)) {
            assets = Object.entries(rawAssets).map(([id, a]: [string, any]) => ({
                id,
                kind: a.Kind || a.kind,
                description: a.Description || a.description || '',
                latestVersion: '',
                versions: Object.keys(a.Versions || a.versions || {}),
                path: a.Path || a.path || ''
            }));
        } else if (Array.isArray(rawAssets)) {
            assets = rawAssets.map((a: any) => ({
                id: a.id || a.ID,
                kind: a.kind || a.Kind,
                description: a.description || a.Description || '',
                latestVersion: a.latestVersion || a.LatestVersion || '',
                versions: a.versions || a.Versions || [],
                path: a.path || a.Path || ''
            }));
        }

        if (kindFilter) {
            return assets.filter(a => a.kind === kindFilter);
        }
        return assets;
    }

    // ---- Install ----

    /** Install an asset from a remote source URL. Adds to config and resolves. */
    async install(url: string, assetId: string, versionRange: string = 'latest', forceReinstall: boolean = false): Promise<ResolvedAsset | { existing: ArcaAssetEntry; selectedVersion: string }> {
        const installed = this.listInstalled();
        const existing = installed.find(a => a.id === assetId);

        if (existing && !forceReinstall) {
            return { existing, selectedVersion: versionRange };
        }

        const remoteAssets = await this.listRemote(url);
        const assetMeta = remoteAssets.find(a => a.id === assetId);
        if (!assetMeta) {
            throw new Error(`Asset ${assetId} not found in remote source.`);
        }

        const target = this.getDefaultMapping(assetMeta.kind, assetId);
        const args = ['install', `"${url}"`, `"${assetId}"`, `"${versionRange}"`, `--target`, `"${target}"`];

        this.cli.run(args);

        // --- Workaround for arca-cli bug: local directory assets are not copied to cache ---
        const isLocal = fs.existsSync(url) && fs.statSync(url).isDirectory();
        if (isLocal && assetMeta.kind === 'skill') {
            const freshInstalled = this.listInstalled();
            const entry = freshInstalled.find(a => a.id === assetId);
            if (entry && entry.mapping) {
                const absTarget = path.isAbsolute(entry.mapping) ? entry.mapping : path.join(this.workspaceRoot, entry.mapping);
                let symlinkExists = false;
                try {
                    symlinkExists = !!fs.lstatSync(absTarget);
                } catch (e) {
                    // ignore
                }

                if (symlinkExists) {
                    const lstat = fs.lstatSync(absTarget);
                    if (lstat.isSymbolicLink()) {
                        const cachePath = fs.readlinkSync(absTarget);

                        let needsCopy = false;
                        if (!fs.existsSync(cachePath)) {
                            needsCopy = true;
                        } else {
                            // Check if it's an empty directory
                            const stats = fs.statSync(cachePath);
                            if (stats.isDirectory() && fs.readdirSync(cachePath).length === 0) {
                                needsCopy = true;
                            }
                        }

                        if (needsCopy) {
                            // Symlink is broken or points to empty dir, arca didn't populate the cache dir

                            let manifestSourcePath = assetId; // fallback
                            try {
                                const yamlData = yaml.load(fs.readFileSync(path.join(url, 'arca-manifest.yaml'), 'utf8')) as any;
                                const verData = yamlData?.assets?.[assetId]?.versions?.[entry.version];
                                if (verData?.path || verData?.Path) {
                                    manifestSourcePath = verData.path || verData.Path;
                                }
                            } catch (e) { }

                            const sourcePath = path.isAbsolute(manifestSourcePath) ? manifestSourcePath : path.join(url, manifestSourcePath);
                            if (sourcePath && fs.existsSync(sourcePath)) {
                                this.copyRecursiveSync(sourcePath, cachePath);
                            }
                        }
                    }
                }
            }
        }

        const freshInstalled = this.listInstalled();
        const entry = freshInstalled.find(a => a.id === assetId);
        if (!entry) {
            throw new Error(`Installation completed but asset ${assetId} not found in config.`);
        }

        return {
            id: entry.id,
            version: entry.version,
            source: entry.source,
            commit: 'local',
            sha256: '',
            content: '',
            cachePath: '',
            mapping: entry.mapping
        };
    }

    // ---- Resolve All ----

    /** Resolve all assets in .arca-assets.yaml, respecting the lockfile. */
    async resolveAll(progress?: ResolveProgress): Promise<ResolvedAsset[]> {
        const args = ['sync'];
        this.cli.run(args);

        const installed = this.listInstalled();
        return installed.map(entry => ({
            id: entry.id,
            version: entry.version,
            source: entry.source,
            commit: 'local',
            sha256: '',
            content: '',
            cachePath: '',
            mapping: entry.mapping
        }));
    }

    // ---- List Installed ----

    /** Get the list of currently installed assets from .arca-assets.yaml. */
    listInstalled(): ArcaAssetEntry[] {
        const args = ['list', '--json'];
        const result = this.cli.run(args);

        const assets = Array.isArray(result) ? result : [];
        return assets.map((a: any) => {
            const id = a.ID || a.id;
            const source = a.Source || a.source;
            const version = a.Version || a.version;
            const projections = a.Projections || a.projections || {};
            const mapping = projections.default || Object.values(projections)[0] as string || '';

            return { id, source, version, mapping };
        });
    }

    private getDefaultMapping(kind: AssetKind, assetId: string): string {
        switch (kind) {
            case 'prompt':
                return `.github/prompts/${assetId}.prompt.md`;
            case 'instruction':
                return `.github/instructions/${assetId}.instructions.md`;
            case 'skill':
                return `.github/skills/${assetId}`;
            default:
                return `.github/prompts/${assetId}.md`;
        }
    }

    private copyRecursiveSync(src: string, dest: string) {
        if (!fs.existsSync(src)) return;

        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach((childItemName) => {
                this.copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
        } else {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }
}
