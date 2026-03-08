import { execSync, execFileSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class CliRunner {
    private arcaPath: string;

    constructor(private workspaceRoot: string) {
        this.arcaPath = this.getArcaExecutable();
    }

    private getArcaExecutable(): string {
        // 1. Check VSCode config
        const config = vscode.workspace.getConfiguration('arca');
        const customPath = config.get<string>('executablePath');
        if (customPath && customPath !== 'arca') {
            if (path.isAbsolute(customPath)) {
                if (fs.existsSync(customPath)) {
                    return customPath;
                }
            } else {
                // Try workspace-relative path
                const absPath = path.join(this.workspaceRoot, customPath);
                if (fs.existsSync(absPath)) {
                    return absPath;
                }
            }
        }

        // 2. Resolve common locations
        const locations = [
            path.join(this.workspaceRoot, '..', 'arca-cli', 'bin', 'arca.exe'),
            path.join(this.workspaceRoot, '..', 'arca-cli', 'bin', 'arca'),
        ];

        // 3. Special handling for WinGet on Windows
        if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
            locations.push(path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'arca.exe'));
        }

        // 4. Try resolving from PATH using resolver
        try {
            const resolver = process.platform === 'win32' ? 'where' : 'which';
            const resolved = execSync(`${resolver} arca`, { encoding: 'utf-8' }).split(/\r?\n/)[0].trim();
            if (resolved && fs.existsSync(resolved)) {
                return resolved;
            }
        } catch (e) {
            // Not found via resolver
        }

        // 5. Check if any location exists
        for (const loc of locations) {
            try {
                if (fs.existsSync(loc)) {
                    return loc;
                }
            } catch (e) {
                // Ignore
            }
        }

        // Fallback to searching in PATH via execFileSync error handling later
        return 'arca';
    }

    public run(args: string[]): any {
        try {
            const output = execFileSync(this.arcaPath, args, {
                cwd: this.workspaceRoot,
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'pipe']
            }) as string;

            if (args.includes('--json') || args.includes('-j')) {
                try {
                    const jsonStart = output.indexOf('{');
                    const jsonStartArr = output.indexOf('[');
                    let start = -1;
                    if (jsonStart !== -1 && (jsonStartArr === -1 || jsonStart < jsonStartArr)) {
                        start = jsonStart;
                    } else if (jsonStartArr !== -1) {
                        start = jsonStartArr;
                    }

                    if (start !== -1) {
                        return JSON.parse(output.substring(start));
                    }
                    return JSON.parse(output);
                } catch (e) {
                    return output;
                }
            }
            return output;
        } catch (err: any) {
            const stderr = err.stderr?.toString() || '';
            const stdout = err.stdout?.toString() || '';

            let userMsg = `ARCA: CLI Command failed: "${this.arcaPath} ${args.join(' ')}"\n\n`;
            if (err.code === 'ENOENT') {
                userMsg += `ERROR: The arca command was not found. If you have it installed, please configure its path in VSCode settings (arca.executablePath).\n`;
            } else {
                userMsg += `ERROR: ${err.message}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`;
            }

            console.error(userMsg);
            throw new Error(userMsg);
        }
    }
}
