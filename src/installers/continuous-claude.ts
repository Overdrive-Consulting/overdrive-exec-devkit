import { join } from "path";
import { readdirSync, statSync, readFileSync } from "fs";
import { execa } from "execa";
import { copyFile, fileExists, ensureDir, getProjectRoot, writeFile } from "../utils/files";
import { printSuccess, printInfo, printWarning } from "../utils/ui";

export interface InstallContinuousClaudeOptions {
  targetDir: string;
  install: boolean;
  forClaude: boolean;
}

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

export async function installContinuousClaude(options: InstallContinuousClaudeOptions): Promise<boolean> {
  const { targetDir, install, forClaude } = options;

  if (!install || !forClaude) {
    return true;
  }

  const root = getProjectRoot();
  const assetsDir = join(root, "assets", "continuous-claude");
  const projectClaudeDir = join(targetDir, ".claude");

  try {
    // Copy skills to project .claude/skills/
    const skillsDir = join(assetsDir, "skills");
    if (fileExists(skillsDir)) {
      const destSkillsDir = join(projectClaudeDir, "skills");
      copyDir(skillsDir, destSkillsDir);
      printSuccess("Copied continuity skills to .claude/skills/");
    }

    // Copy hooks to project .claude/hooks/
    const hooksDir = join(assetsDir, "hooks");
    if (fileExists(hooksDir)) {
      const destHooksDir = join(projectClaudeDir, "hooks");
      copyDir(hooksDir, destHooksDir);
      printSuccess("Copied continuity hooks to .claude/hooks/");
    }

    // Create thoughts/ directory structure
    ensureDir(join(targetDir, "thoughts", "ledgers"));
    ensureDir(join(targetDir, "thoughts", "shared", "handoffs"));
    ensureDir(join(targetDir, "thoughts", "shared", "plans"));
    ensureDir(join(projectClaudeDir, "cache", "artifact-index"));
    printSuccess("Created thoughts/ directory structure");

    // Initialize SQLite database if sqlite3 is available
    const schemaFile = join(assetsDir, "scripts", "artifact_schema.sql");
    const dbPath = join(projectClaudeDir, "cache", "artifact-index", "context.db");

    if (fileExists(schemaFile) && !fileExists(dbPath)) {
      try {
        const schema = readFileSync(schemaFile, "utf-8");
        await execa("sqlite3", [dbPath], { input: schema, cwd: targetDir });
        printSuccess("Initialized artifact-index database");
      } catch {
        printInfo("SQLite not available - database will be created on first use");
      }
    }

    // Add to .gitignore
    const gitignorePath = join(targetDir, ".gitignore");
    if (fileExists(gitignorePath)) {
      const content = readFileSync(gitignorePath, "utf-8");
      if (!content.includes(".claude/cache/")) {
        writeFile(gitignorePath, content + "\n# Continuous Claude cache\n.claude/cache/\n");
        printSuccess("Added .claude/cache/ to .gitignore");
      }
    }

    return true;
  } catch (error) {
    printWarning("Continuous Claude installation failed");
    return false;
  }
}
