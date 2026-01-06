import { join } from "path";
import { readdirSync, statSync } from "fs";
import { copyFile, ensureDir, fileExists, readJson, writeJson, getProjectRoot } from "../utils/files";
import { deepMerge } from "../utils/merge";
import { printSuccess, printInfo } from "../utils/ui";

export interface InstallSafetyNetOptions {
    targetDir: string;
    install: boolean;
    forClaude: boolean;
}

interface ClaudeSettings {
    hooks?: {
        PreToolUse?: Array<{
            matcher: string;
            hooks: Array<{
                type: string;
                command: string;
            }>;
        }>;
    };
}

const SAFETY_NET_HOOK = {
    PreToolUse: [
        {
            matcher: "Bash",
            hooks: [
                {
                    type: "command",
                    command: 'python3 "${PWD}/.claude/scripts/safety_net.py"',
                },
            ],
        },
    ],
};

/**
 * Recursively copy a directory
 */
function copyDir(src: string, dest: string) {
    ensureDir(dest);
    const entries = readdirSync(src);

    for (const entry of entries) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        const stat = statSync(srcPath);

        if (stat.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

/**
 * Merge hooks into existing .claude/settings.json
 */
function mergeClaudeSettings(targetDir: string) {
    const settingsPath = join(targetDir, ".claude", "settings.json");
    let existing: ClaudeSettings = {};

    if (fileExists(settingsPath)) {
        try {
            existing = readJson<ClaudeSettings>(settingsPath);
        } catch {
            // Invalid JSON, start fresh
        }
    }

    // Merge hooks, avoiding duplicates
    const existingHooks = existing.hooks?.PreToolUse || [];
    const hasSafetyNet = existingHooks.some(
        (h) => h.matcher === "Bash" && h.hooks.some((hh) => hh.command.includes("safety_net.py"))
    );

    if (!hasSafetyNet) {
        const merged = deepMerge(existing as Record<string, unknown>, {
            hooks: {
                ...existing.hooks,
                PreToolUse: [...existingHooks, ...SAFETY_NET_HOOK.PreToolUse],
            },
        });
        writeJson(settingsPath, merged);
        return true;
    }

    return false;
}

export async function installSafetyNet(options: InstallSafetyNetOptions): Promise<boolean> {
    const { targetDir, install, forClaude } = options;

    if (!install || !forClaude) {
        return true;
    }

    const root = getProjectRoot();
    const safetyNetDir = join(root, "claude-code-safety-net");

    // Copy scripts
    const scriptsDir = join(safetyNetDir, "scripts");
    const destScriptsDir = join(targetDir, ".claude", "scripts");

    copyFile(join(scriptsDir, "safety_net.py"), join(destScriptsDir, "safety_net.py"));
    copyDir(join(scriptsDir, "safety_net_impl"), join(destScriptsDir, "safety_net_impl"));
    printSuccess("Copied safety net scripts to .claude/scripts/");

    // Copy commands
    const commandsDir = join(safetyNetDir, "commands");
    const destCommandsDir = join(targetDir, ".claude", "commands");

    copyFile(join(commandsDir, "set-custom-rules.md"), join(destCommandsDir, "set-custom-rules.md"));
    copyFile(join(commandsDir, "verify-custom-rules.md"), join(destCommandsDir, "verify-custom-rules.md"));

    // Copy CUSTOM_RULES_REFERENCE.md (referenced by commands)
    const refFile = join(safetyNetDir, "CUSTOM_RULES_REFERENCE.md");
    if (fileExists(refFile)) {
        copyFile(refFile, join(targetDir, ".claude", "CUSTOM_RULES_REFERENCE.md"));
    }
    printSuccess("Copied safety net commands to .claude/commands/");

    // Merge hooks into settings.json
    const hookedAdded = mergeClaudeSettings(targetDir);
    if (hookedAdded) {
        printSuccess("Added safety net hooks to .claude/settings.json");
    } else {
        printInfo("Safety net hooks already configured");
    }

    return true;
}
