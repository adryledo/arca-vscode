# Roadmap: Redesign and Plan ARCA v1.0

- [x] Fix skills not being resolved. Cache folder is empty
- [ ] Add AGENTS.md, nodejs INSTRUCTIONS, pre-commit HOOKS and other needed assets to improve agent performance.
- [ ] Implement support for 'kind' field from arca-cli in asset management UI
- [ ] Update Protocol Documentation (`/docs`) with brief description and reference arca-cli. Open source pre-launch checklist (LICENSE, CONTRIBUTING, PULL_REQUEST_TEMPLATE, CODE_OF_CONDUCT, improved ROADMAP, README, CHANGELOG, etc...)
- [ ] Show already used sources on list-remotes command
- [ ] Github action to create release and publish extension to marketplace
- [ ] Change assetResolver.ts/getDefaultMapping to use different location by coding agent. Claude example:
    - Agents: .claude/agents/
    - Instructions: .claude/instructions/ and modify CLAUDE.md to point to instructions folder. 
    - Skills: .claude/skills/
    - Plugins: .claude/plugin-name/
    - Hooks: .claude/hooks/ and reference from .claude/settings.json
- [ ] Detect when new version of asset is available and notify the user.
- [ ] Open asset from assets panel in markdown-preview mode.
- [ ] Manifest Diagnostics (Red squiggles)
