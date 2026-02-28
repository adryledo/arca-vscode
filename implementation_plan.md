# ARCA v0.0.1: Implementation Plan

## Technical Stack & Rationale

| Component | Stack | Reasoning |
| :--- | :--- | :--- |
| **ARCA CLI** | **Go** | Standalone, high-performance, and portable. Handles core logic, caching, and projections. Zero runtime dependencies. |
| **VS Code Extension** | **TS + ARCA CLI** | UI wrapper that invokes the Go binary. Ensures consistent behavior across IDEs. |

> [!IMPORTANT]
> The core protocol engine has been migrated from a TypeScript implementation to a **standalone Go CLI (ARCA)**. This allows the same logic to be used in VS Code, JetBrains, and CI/CD pipelines without duplication.

---

## Integration Strategy: Workspace Projection

The user wants assets like prompts to work with existing IDE assistants (which scan `.github/prompts/` etc.) without waiting for those assistants to adopt the ARCA protocol.

### The "Mapping" Mechanism
1.  **Resolve**: The Engine downloads the asset from the source to the Central Cache (`~/.arca-cache/`).
2.  **Projection**: The Engine creates a **symbolic link** from the cache to the workspace path (e.g., `.github/prompts/my-prompt.md`).
3.  **Clean Git**: The Engine automatically adds the projected path to `.gitignore` to ensure symlinks aren't committed.

---

## Phased Roadmap

### Phase 1: Protocol Prototype (Alpha)
- [x] **CLI Commands**:
  - [x] `arca list-remote <url> [--kind <type>]`: Lists available assets from any ARCA-compliant source repository. Valid types: `prompt`, `skill`, `instruction`.
  - [x] `arca install <url> <asset-id>`: 
    - [x] Fetches the manifest from `<url>`.
    - [x] Automatically adds the source to `.arca-assets.yaml` if missing.
    - [x] Adds the asset entry.
    - [x] **Calls `resolve` automatically.**
  - [x] `arca list`: Lists currently installed assets in the project workspace.
  - [x] `arca sync`: Explicitly fetches manifests, downloads to cache, and refreshes symlinks.
- [x] **Core Engine**: Manifest fetching (GitHub/Azure REST APIs) and SemVer resolution.
- [x] **Workspace Mapper**: Symlink creation logic and `.gitignore` automation.
- [x] **Lockfile Implementation**: Generation and verification.
- [x] **Standardization**: Moved from PARCA to ARCA naming.

### Phase 2: VS Code Extension UI & Source-Side Tools
- [/] **Consumer UI Improvements**:
  - [x] **Version Picker**: Show dropdown of available versions during installation (Handled by `install` arg).
  - [ ] **Explorer View**: Tree view showing active assets and their mapping status.
- [x] **Source-Side Tooling (Maintainer)**:
  - [x] **`arca publish`**: Command that helps maintainers:
    - [x] Auto-detect changes in assets.
    - [x] Propose SemVer increment.
    - [x] **Checkpointing**: Auto-fill the `ref` of the *previous* version with the current commit SHA to "freeze" it before adding the new rolling version.
    - [x] Automatically update `arca-manifest.yaml`.
    - [ ] Stage changes for Git commit.
  - [x] **Manifest Scaffolding**: Automatically creates manifest on first publish.
- [ ] **Diagnostics**: Red squiggles in `.arca-assets.yaml` for invalid versions or missing assets.
- [x] **Agent Skills Alignment**:
  - [x] Update default mapping for `skill` kind to `.arca/assets/${source}/${assetId}`.
  - [x] Ensure compatibility with directory-based assets (recursive fetch for skills).

### Phase 3: Robustness & Scaling
- [ ] **Transitive Dependencies**: Graphic resolution.
- [x] **Universal Hashing**: LF-normalized SHA-256 for cross-platform lockfile consistency.
- [x] **Caching**: Machine-wide cache with deterministic path indexing.

### Phase 4: Expansion
- [ ] **LM Tool Integration**: For assistants that support tool-calling.
- [ ] **Sigstore / OIDC Verification**: To ensure asset authenticity.
- [ ] **Discovery UI**: Visual gallery of available assets from known sources.

---

## Verification Plan

### Automated Tests
- Test resolution against mock Git repositories.
- Verify SHA-256 consistency across different OS line endings.
- Unit tests for SemVer range matching.

### Manual Verification
- Verify the VS Code extension correctly identifies and installs assets in a test consumer repo.
- Verify discovery UI displays assets from a remote manifest.
