import { execa } from "execa";
import { printSuccess, printError, printInfo, printWarning } from "../utils/ui";

async function isBdInstalled(): Promise<boolean> {
  try {
    await execa("bd", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

async function isGitRepo(targetDir: string): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--git-dir"], { cwd: targetDir });
    return true;
  } catch {
    return false;
  }
}

export interface InstallBeadsOptions {
  targetDir: string;
  mode: "full" | "mcp" | "skip";
  forClaude: boolean;
  forCursor: boolean;
}

export async function installBeads(options: InstallBeadsOptions): Promise<boolean> {
  const { targetDir, mode, forClaude, forCursor } = options;

  if (mode === "skip") {
    return true;
  }

  if (mode === "mcp") {
    printInfo("To use beads MCP server, install it with:");
    console.log("  uv tool install beads-mcp");
    console.log("  # or: pip install beads-mcp");
    printInfo("Then add to your MCP config:");
    console.log('  { "beads": { "command": "beads-mcp" } }');
    return true;
  }

  // Full installation
  const bdInstalled = await isBdInstalled();

  if (!bdInstalled) {
    printWarning("bd (beads CLI) is not installed");
    printInfo("Install it with one of:");
    console.log("  brew install beads-dev/tap/bd");
    console.log("  # or: curl -fsSL https://beads.dev/install.sh | sh");
    printInfo("After installing, run 'adk init' again to complete beads setup");
    return false;
  }

  // Initialize beads
  try {
    printInfo("Initializing beads...");
    await execa("bd", ["init"], { cwd: targetDir, stdio: "inherit" });
    printSuccess("Beads initialized");
  } catch (error) {
    printError("Failed to initialize beads");
    return false;
  }

  // Run tool-specific setup
  if (forClaude) {
    try {
      printInfo("Setting up beads for Claude Code...");
      await execa("bd", ["setup", "claude"], { cwd: targetDir, stdio: "inherit" });
      printSuccess("Beads Claude Code integration configured");
    } catch (error) {
      printWarning("Failed to configure beads for Claude Code");
    }
  }

  if (forCursor) {
    try {
      printInfo("Setting up beads for Cursor...");
      await execa("bd", ["setup", "cursor"], { cwd: targetDir, stdio: "inherit" });
      printSuccess("Beads Cursor integration configured");
    } catch (error) {
      printWarning("Failed to configure beads for Cursor");
    }
  }

  // Install git hooks if in a git repo
  const isGit = await isGitRepo(targetDir);
  if (isGit) {
    try {
      printInfo("Installing beads git hooks...");
      await execa("bd", ["hooks", "install", "--shared"], { cwd: targetDir, stdio: "inherit" });
      printSuccess("Beads git hooks installed");
    } catch (error) {
      printWarning("Failed to install beads git hooks");
    }
  }

  return true;
}
