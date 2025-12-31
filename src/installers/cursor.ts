import { join } from "path";
import { copyFile, ensureDir, fileExists, getProjectRoot } from "../utils/files";
import { printSuccess, printInfo } from "../utils/ui";
import { getAvailableCommands } from "./claude";

export interface InstallCursorOptions {
  targetDir: string;
  commands: string[];
}

export function installCursor(options: InstallCursorOptions) {
  const { targetDir, commands } = options;
  const root = getProjectRoot();

  // Install commands
  if (commands.length > 0) {
    const targetCommandsDir = join(targetDir, ".cursor", "commands");
    ensureDir(targetCommandsDir);

    for (const cmd of commands) {
      const src = join(root, "commands", `${cmd}.md`);
      const dest = join(targetCommandsDir, `${cmd}.md`);

      if (fileExists(dest)) {
        printInfo(`Skipping ${cmd}.md (already exists in Cursor)`);
        continue;
      }

      copyFile(src, dest);
      printSuccess(`Added Cursor command: ${cmd}`);
    }
  }

  // Ensure rules directory exists
  const rulesDir = join(targetDir, ".cursor", "rules");
  ensureDir(rulesDir);
}
