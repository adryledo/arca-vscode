# Roadmap: Redesign and Plan ARCA v1.0

- [ ] Update Protocol Documentation (`/docs`)
- [ ] Change assetResolver.ts/getDefaultMapping to use different location by coding agent. Claude example:
    - Agents: .claude/agents/
    - Instructions: .claude/instructions/ and modify CLAUDE.md to point to instructions folder. 
    - Skills: .claude/skills/
    - Plugins: .claude/plugin-name/
    - Hooks: .claude/hooks/ and reference from .claude/settings.json
- [ ] Detect when new version of asset is available and notify the user.
- [ ] Manifest Diagnostics (Red squiggles)
