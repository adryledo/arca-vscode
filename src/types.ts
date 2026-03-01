/**
 * ARCA - Protocol of Asset Resolution for Coding Agents
 * Core type definitions.
 */

// --- Asset Types ---

export type AssetKind = 'skill' | 'instruction';

// --- Consumer Config (.arca-assets.yaml) ---

export interface ArcaConfig {
    schema: string;
    sources: Record<string, ArcaSource>;
    assets: ArcaAssetEntry[];
}

export interface ArcaSource {
    type: 'git';
    provider: 'github' | 'azure';
    url: string;
}

export interface ArcaAssetEntry {
    id: string;
    source: string;
    version: string;
    mapping?: string;
}

// --- Source Manifest (arca-manifest.yaml) ---

export interface ArcaManifest {
    schema: string;
    versionStrategy?: {
        template?: string;
    };
    assets: Record<string, ArcaManifestAsset>;
}

export interface ArcaManifestAsset {
    kind: AssetKind;
    description?: string;
    versions: Record<string, ArcaManifestVersion>;
}

export interface ArcaManifestVersion {
    ref?: string;
    path: string;
    runtime?: ArcaRuntime;
}

export interface ArcaRuntime {
    llm?: Array<{ provider: string; models: string[] }>;
    min_context_tokens?: number;
    requires_tools?: boolean;
}

// --- Lockfile (.arca-assets.lock) ---

export interface ArcaLockfile {
    assets: ArcaLockedAsset[];
}

export interface ArcaLockedAsset {
    id: string;
    version: string;
    source: string;
    commit: string;
    sha256: string;
    manifestHash: string;
    resolvedAt: string;
}

// --- Resolution Results ---

export interface ResolvedAsset {
    id: string;
    version: string;
    source: string;
    commit: string;
    sha256: string;
    content: string;
    cachePath: string;
    mapping?: string;
}

// --- Remote Listing ---

export interface RemoteAssetInfo {
    id: string;
    kind: AssetKind;
    description: string;
    latestVersion: string;
    versions: string[];
    path?: string;
    resolvedCommit?: string; // The commit SHA where this version was discovered (added during resolution)
}
