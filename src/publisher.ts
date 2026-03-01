import { CliRunner } from './cliRunner';
import { ArcaManifest, AssetKind } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const MANIFEST_FILENAME = 'arca-manifest.yaml';

export class Publisher {
    private cli: CliRunner;
    private manifestPath: string;

    constructor(private workspaceRoot: string) {
        this.cli = new CliRunner(workspaceRoot);
        this.manifestPath = path.join(workspaceRoot, MANIFEST_FILENAME);
    }

    /** Check if this workspace is a source repository. */
    isSourceRepo(): boolean {
        return fs.existsSync(this.manifestPath);
    }

    /** Load the manifest. */
    loadManifest(): ArcaManifest {
        if (!this.isSourceRepo()) {
            throw new Error(`ARCA manifest not found at ${this.manifestPath}.`);
        }
        const raw = fs.readFileSync(this.manifestPath, 'utf-8');
        return yaml.load(raw) as ArcaManifest;
    }

    /** Initialize a new source repository manifest. */
    initManifest(): ArcaManifest {
        const manifest: ArcaManifest = {
            schema: '1.0',
            assets: {},
        };
        const content = yaml.dump(manifest, { lineWidth: 120, noRefs: true, sortKeys: false });
        fs.writeFileSync(this.manifestPath, content, 'utf-8');
        return manifest;
    }

    /** Propose the next version for an asset. */
    proposeNextVersion(manifest: ArcaManifest, assetId: string, level: 'patch' | 'minor' | 'major' = 'patch'): string {
        // We can keep this helper in TS as it's simple and doesn't involve complex logic
        const semver = require('semver');
        const asset = manifest.assets[assetId];
        if (!asset) { return '1.0.0'; }

        const versions = Object.keys(asset.versions).filter(v => semver.valid(v));
        if (versions.length === 0) { return '1.0.0'; }

        const latest = semver.maxSatisfying(versions, '*') || versions.sort().reverse()[0];
        const next = semver.inc(latest, level);
        return next || '1.0.0';
    }

    /** Publish a new version of an asset. */
    async publishVersion(
        _manifest: ArcaManifest, // Kept for interface compatibility
        assetId: string,
        version: string,
        filePath: string,
        kind: AssetKind = 'instruction',
    ): Promise<void> {
        const args = ['publish', `"${assetId}"`, `"${version}"`, `"${kind}"`, `"${filePath}"`];
        this.cli.run(args);
    }
}
