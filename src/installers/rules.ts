import { join } from "path";
import { readdirSync } from "fs";
import { copyFile, ensureDir, fileExists, getProjectRoot, readFile } from "../utils/files";
import { printSuccess, printInfo } from "../utils/ui";

export function getAvailableRules(): string[] {
  const root = getProjectRoot();
  const rulesDir = join(root, "rules");

  try {
    return readdirSync(rulesDir)
      .filter(f => f.endsWith(".md"))
      .map(f => f.replace(".md", ""));
  } catch {
    return [];
  }
}

export function getRuleOptions() {
  const rules = getAvailableRules();
  const root = getProjectRoot();

  return rules.map(rule => {
    const rulePath = join(root, "rules", `${rule}.md`);
    let description = rule;

    try {
      const content = readFile(rulePath);
      // Extract first heading or first line as description
      const match = content.match(/^#\s+(.+?)$/m);
      description = match?.[1] || rule;
    } catch {
      // Use default
    }

    return {
      value: rule,
      label: rule,
      hint: description,
    };
  });
}

export interface InstallRulesOptions {
  targetDir: string;
  rules: string[];
  forClaude: boolean;
  forCursor: boolean;
}

export function installRules(options: InstallRulesOptions) {
  const { targetDir, rules, forClaude, forCursor } = options;
  const root = getProjectRoot();

  if (rules.length === 0) {
    return;
  }

  // Install to Claude Code
  if (forClaude) {
    const claudeRulesDir = join(targetDir, ".claude", "rules");
    ensureDir(claudeRulesDir);

    for (const rule of rules) {
      const src = join(root, "rules", `${rule}.md`);
      const dest = join(claudeRulesDir, `${rule}.md`);

      if (fileExists(dest)) {
        printInfo(`Skipping Claude rule ${rule}.md (already exists)`);
        continue;
      }

      copyFile(src, dest);
      printSuccess(`Added Claude rule: ${rule}`);
    }
  }

  // Install to Cursor
  if (forCursor) {
    const cursorRulesDir = join(targetDir, ".cursor", "rules");
    ensureDir(cursorRulesDir);

    for (const rule of rules) {
      const src = join(root, "rules", `${rule}.md`);
      const dest = join(cursorRulesDir, `${rule}.md`);

      if (fileExists(dest)) {
        printInfo(`Skipping Cursor rule ${rule}.md (already exists)`);
        continue;
      }

      copyFile(src, dest);
      printSuccess(`Added Cursor rule: ${rule}`);
    }
  }
}
