import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AssetResolver } from '../src/assetResolver';

describe('Baseline Integration Test (CLI-based)', () => {
  let testDir: string;
  let sourceDir: string;
  let resolver: AssetResolver;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arca-test-'));
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arca-source-'));

    fs.writeFileSync(path.join(sourceDir, 'arca-manifest.yaml'), `
schema: 1.0
assets:
  test-asset:
    kind: instruction
    description: "Test instruction"
    versions:
      1.0.0:
        path: "instructions/test.md"
  test-skill:
    kind: skill
    description: "Test skill"
    versions:
      1.0.0:
        path: "skills/test-skill"
`, 'utf-8');

    fs.mkdirSync(path.join(sourceDir, 'instructions'), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'instructions', 'test.md'), '# Hello Test');

    fs.mkdirSync(path.join(sourceDir, 'skills', 'test-skill'), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'skills', 'test-skill', 'SKILL.md'), '# Test Skill Content');
    fs.writeFileSync(path.join(sourceDir, 'skills', 'test-skill', 'helper.js'), 'console.log("hello");');

    resolver = new AssetResolver(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(sourceDir, { recursive: true, force: true });
  });

  it('should install an asset correctly via CLI', async () => {
    console.log('--- TEST: install asset ---');
    await resolver.install(sourceDir, 'test-asset', '1.0.0');
    const mappingPath = path.join(testDir, '.github', 'instructions', 'test-asset.instructions.md');
    assert.ok(fs.existsSync(mappingPath), `Mapping path should exist: ${mappingPath}`);
    assert.strictEqual(fs.readFileSync(mappingPath, 'utf-8').trim(), '# Hello Test');
  });

  it('should install a skill correctly via CLI', async () => {
    console.log('--- TEST: install skill ---');
    await resolver.install(sourceDir, 'test-skill', '1.0.0');

    const skillDir = path.join(testDir, '.github', 'skills', 'test-skill');
    console.log(`Directory check ${skillDir}: exists=`, fs.existsSync(skillDir));
    if (fs.existsSync(skillDir) || (!fs.existsSync(skillDir) && fs.existsSync(path.dirname(skillDir)))) {
      try {
        const lstat = fs.lstatSync(skillDir);
        console.log(`lstat: isSymlink=`, lstat.isSymbolicLink());
        if (lstat.isSymbolicLink()) {
          console.log(`readlink: `, fs.readlinkSync(skillDir));
        }
        const files = fs.readdirSync(skillDir);
        console.log(`files in dir: `, files);
      } catch (e) {
        console.log(`error stats/reading dir: `, e);
      }
    }

    const mappingPath = path.join(testDir, '.github', 'skills', 'test-skill', 'SKILL.md');
    assert.ok(fs.existsSync(mappingPath), `Skill file should exist: ${mappingPath}`);
    assert.strictEqual(fs.readFileSync(mappingPath, 'utf-8').trim(), '# Test Skill Content');
  });

  it('should list remote assets via CLI', async () => {
    console.log('--- TEST: list remote ---');
    const assets = await resolver.listRemote(sourceDir);
    console.log('Remote assets:', JSON.stringify(assets, null, 2));
    assert.strictEqual(assets.length, 2);
    assert.ok(assets.find(a => a.id === 'test-asset'), 'Should find test-asset');
  });

  it('should resolve all assets from config via CLI', async () => {
    console.log('--- TEST: resolve all ---');
    await resolver.install(sourceDir, 'test-asset', '1.0.0');
    fs.rmSync(path.join(testDir, '.github'), { recursive: true, force: true });
    const results = await resolver.resolveAll();
    console.log('Sync results:', JSON.stringify(results, null, 2));
    assert.strictEqual(results.length, 1);
    assert.ok(fs.existsSync(path.join(testDir, '.github', 'instructions', 'test-asset.instructions.md')));
  });
});
