import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class CliRunner {
    private arcaPath: string;

    constructor(private workspaceRoot: string) {
        this.arcaPath = this.getArcaExecutable();
    }

    private getArcaExecutable(): string {
        // In a production extension, this might be bundled or configured via settings
        // For this migration, we check some common locations or look for it in arca-cli/bin
        const locations = [
            'c:\\Source\\VSCode Extensions\\arca-cli\\bin\\arca.exe', // TODO: Prompt to install arca if it is not found in the default location or VSCode settings
            path.join(this.workspaceRoot, '..', 'arca-cli', 'bin', 'arca.exe'),
            path.join(this.workspaceRoot, '..', 'arca-cli', 'bin', 'arca'),
            'arca.exe',
            'arca'
        ];

        for (const loc of locations) {
            try {
                if (fs.existsSync(loc)) {
                    return loc;
                }
            } catch (e) {
                // Ignore
            }
        }

        return 'arca'; // Fallback to PATH
    }

    public run(args: string[]): any {
        const cmd = `"${this.arcaPath}" ${args.join(' ')}`;
        try {
            const output = execSync(cmd, {
                cwd: this.workspaceRoot,
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'pipe']
            });

            if (args.includes('--json') || args.includes('-j')) {
                try {
                    // Try to extract JSON from output (in case there is leading text)
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
            const msg = `CLI Error: ${err.message}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`;
            console.error(msg);
            throw new Error(msg);
        }
    }
}
