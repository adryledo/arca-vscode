# ARCA v0.0.1 - Protocol of Asset Resolution for Coding Agents

A decentralized standard for distributing, versioning, and consuming agentic assets (prompts, skills, instructions) across coding agents and IDEs.

## 🎯 Overview

ARCA enables developers to:
- **Discover** and install reusable assets (prompts, skills, instructions) from remote sources
- **Version** assets with SemVer support and deterministic lockfiles
- **Integrate** seamlessly with existing IDE assistants through workspace projection
- **Manage** assets with zero Git tag overhead through a dynamic registry model

No complex tag management. No vendor lock-in. Just simple, decentralized asset distribution.

## ✨ Key Features

### For Consumers
- 🔍 **Asset Discovery**: Browse available assets with `arca list-remote <url>`
- 📦 **One-Command Installation**: `arca install <url> <asset-id>` handles everything
- 🔒 **Deterministic Locking**: `.arca-assets.lock` ensures reproducibility across machines and time
- 🔄 **Automatic Workspace Projection**: Assets are symlinked into IDE-friendly locations (e.g., `.github/prompts/`)
- 🛡️ **Integrity Verification**: LF-normalized SHA-256 validation across all platforms
- 🔐 **Smart Authentication**: VS Code GitHub integration with fallback to environment variables

### For Maintainers
- 📝 **Registry-as-Truth**: The `arca-manifest.yaml` on `main` is your source of truth—no Git tags needed
- 🚀 **Assisted Publishing**: `ARCA: Publish Asset Version` command auto-increments versions and checkpoints old releases
- 📌 **Immutability Guarantees**: Previous versions are frozen at their commit SHA, protecting consumers from upstream changes

## 🏗️ Architecture

### Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Protocol Engine** | TypeScript / Node.js | Manifest fetching, version resolution, file downloading, workspace mapping |
| **VS Code Extension** | VS Code API | UI, asset discovery, installation workflows, maintainer commands |
| **CLI Tool** | Node.js Executable | CI/CD integration and command-line asset management |

### The Resolution Flow

```
Consumer Project
    ↓
[arca install <url> <asset-id>]
    ↓
Fetch arca-manifest.yaml from Source Repo
    ↓
Resolve asset to specific Git ref (commit SHA)
    ↓
Download file to ~/.arca-cache/
    ↓
Compute SHA-256 (LF-normalized)
    ↓
Create symlink in workspace (e.g., .github/prompts/)
    ↓
Update .arca-assets.lock for reproducibility
```

## 📋 Files & Specs

### Consumer Configuration (`.arca-assets.yaml`)
Tracks installed assets and their sources:

```yaml
schema: 1.0
sources:
  my-org:
    type: git
    provider: github
    url: "https://github.com/my-org/agent-assets"
assets:
  - id: refactor-logic
    source: my-org
    version: "1.2.0"
    mapping: ".github/prompts/refactor.md"
```

### Source Manifest (`arca-manifest.yaml`)
Published by maintainers to define available assets:

```yaml
schema: 1.0
version-strategy:
  template: "v{{version}}"
assets:
  refactor-logic:
    kind: prompt
    description: "Refactoring assistance for complex logic"
    versions:
      1.2.0:
        path: "prompts/refactor.md"
        ref: "v1.2.0"
```

### Lockfile (`.arca-assets.lock`)
Ensures reproducibility by pinning commit SHAs and content hashes:

```json
{
  "assets": [
    {
      "id": "refactor-logic",
      "version": "1.2.0",
      "source": "my-org",
      "commit": "abc12345",
      "sha256": "hash_of_content",
      "manifestHash": "hash_of_manifest_at_time_of_resolution"
    }
  ]
}
```

## 🚀 Getting Started

### Installation
```bash
# Install the ARCA VS Code Extension from the Marketplace
# Or use the CLI
npm install -g arca
```

### For Consumers
```bash
# Discover available assets
arca list-remote https://github.com/my-org/agent-assets

# Install an asset
arca install https://github.com/my-org/agent-assets my-prompt

# List installed assets
arca list

# Refresh all assets to latest versions
arca resolve
```

### For Maintainers
1. Create a `arca-manifest.yaml` in your asset repository
2. Define your assets with versions and file paths
3. Use the VS Code `ARCA: Publish Asset Version` command to:
   - Auto-increment SemVer
   - Checkpoint previous versions at their commit SHA
   - Update the manifest
   - Stage changes for commit

## 🔄 Workspace Integration

Assets are automatically projected into your workspace via symlinks:

```
Consumer Repo
├── .github/
│   └── prompts/
│       └── refactor.md  → symlink → ~/.arca-cache/abc12345/refactor.md
├── .arca-assets.yaml
├── .arca-assets.lock
└── .gitignore (auto-updated with symlink paths)
```

This allows existing IDE assistants to discover and use assets without adopting ARCA directly.

## 🔐 Security & Reliability

- **Authenticated Requests**: Uses GitHub authentication (VS Code integration or env vars) for higher API rate limits
- **Content Validation**: LF-normalized SHA-256 hashing prevents corruption across platforms
- **Immutable References**: Lockfiles pin commit SHAs, ensuring assets don't change unexpectedly
- **Vendor Neutrality**: Works with GitHub, Azure DevOps, and other Git providers

## 📦 What's Included (v0.0.1)

✅ **Phase 1: Core Engine**
- Manifest fetching and parsing
- SemVer version resolution
- File downloading with integrity verification
- Dynamic caching with LF-normalized SHA-256 validation
- Workspace projection with symlinks and `.gitignore` automation
- Deterministic lockfile generation

✅ **Phase 2: VS Code UX & Maintainer Tools**
- Version picker during installation
- Explorer view showing active assets
- `ARCA: Publish Asset Version` command with auto-versioning and checkpointing
- Manifest scaffolding for new source repositories

🔜 **Phase 3: Robustness & Scaling**
- Transitive dependencies
- Universal hashing verification
- Intelligent caching and eviction

🔜 **Phase 4: Expansion**
- LM tool integration
- Sigstore/OIDC verification
- Visual asset gallery

## 🛠️ Development

This project is built in **TypeScript** for seamless VS Code extension development and cross-platform CLI usage.

```bash
# Compile TypeScript
npx tsc

# Verify zero compilation errors
npx tsc --noEmit
```

## 📖 Detailed Documentation

- **[protocol_v1.md](protocol_v1.md)** — Complete formal specification
- **[implementation_plan.md](implementation_plan.md)** — Phased roadmap and technical details
- **[walkthrough.md](walkthrough.md)** — Progress summary and accomplishments

## 🎓 Philosophy

ARCA is built on three principles:

1. **Decentralized**: No central registry or package manager needed—any Git repository with a manifest becomes a source
2. **Developer-Friendly**: Minimal YAML configuration; CLI and UI handle the complexity
3. **Agent-Ready**: Designed for AI coding assistants to discover and consume assets naturally

## 📝 License

See the repository for licensing details.

---

**Ready to manage your agentic assets with ARCA?** Start with `arca list-remote` to explore what's available! 🚀
