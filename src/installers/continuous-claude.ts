import { join } from "path";
import { execa } from "execa";
import { fileExists, ensureDir } from "../utils/files";
import { printSuccess, printInfo, printWarning } from "../utils/ui";

export interface InstallContinuousClaudeOptions {
  targetDir: string;
  mode: "full" | "project" | "skip";
  forClaude: boolean;
}

async function checkContinuousClaudeInstalled(): Promise<boolean> {
  const globalSkillsDir = join(process.env.HOME || "~", ".claude", "skills");
  return fileExists(join(globalSkillsDir, "continuity_ledger", "SKILL.md"));
}

async function runGlobalInstall(): Promise<boolean> {
  const continuousClaudeDir = join(process.cwd(), "continuous-claude");
  const installScript = join(continuousClaudeDir, "install-global.sh");

  if (!fileExists(installScript)) {
    printWarning("continuous-claude not found in current directory");
    printInfo("Clone it first: git clone <continuous-claude-repo>");
    return false;
  }

  try {
    printInfo("Running continuous-claude global install...");
    await execa("bash", [installScript, "--yes"], {
      stdio: "inherit",
      cwd: continuousClaudeDir,
    });
    return true;
  } catch (error) {
    printWarning("Global install failed - run manually: ./continuous-claude/install-global.sh");
    return false;
  }
}

async function runProjectInit(targetDir: string): Promise<boolean> {
  // Check if global install exists
  const globalScripts = join(process.env.HOME || "~", ".claude", "scripts");
  const initScript = join(globalScripts, "init-project.sh");

  // Also check in the continuous-claude directory
  const localScript = join(process.cwd(), "continuous-claude", "init-project.sh");

  const scriptToUse = fileExists(initScript) ? initScript : localScript;

  if (!fileExists(scriptToUse)) {
    printWarning("init-project.sh not found");
    printInfo("Run global install first, or use: ./continuous-claude/init-project.sh");
    return false;
  }

  try {
    // Create the directory structure manually to avoid interactive prompts
    ensureDir(join(targetDir, "thoughts", "ledgers"));
    ensureDir(join(targetDir, "thoughts", "shared", "handoffs"));
    ensureDir(join(targetDir, "thoughts", "shared", "plans"));
    ensureDir(join(targetDir, ".claude", "cache", "artifact-index"));

    printSuccess("Created thoughts/ directory structure");
    return true;
  } catch (error) {
    printWarning("Project init failed");
    return false;
  }
}

export async function installContinuousClaude(options: InstallContinuousClaudeOptions): Promise<boolean> {
  const { targetDir, mode, forClaude } = options;

  if (mode === "skip" || !forClaude) {
    return true;
  }

  const isInstalled = await checkContinuousClaudeInstalled();

  if (mode === "full") {
    if (!isInstalled) {
      const success = await runGlobalInstall();
      if (!success) return false;
    } else {
      printInfo("Continuous Claude already installed globally");
    }

    // Always run project init
    return await runProjectInit(targetDir);
  }

  if (mode === "project") {
    if (!isInstalled) {
      printWarning("Global install not found - run install-global.sh first");
      return false;
    }

    return await runProjectInit(targetDir);
  }

  return true;
}
