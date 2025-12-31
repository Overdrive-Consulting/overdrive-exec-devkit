import { join } from "path";
import { readdirSync, statSync } from "fs";
import { copyFile, ensureDir, fileExists, getProjectRoot, readFile, writeFile } from "../utils/files";
import { printSuccess, printInfo } from "../utils/ui";

export function getAvailableCommands(): string[] {
  const root = getProjectRoot();
  const commandsDir = join(root, "commands");

  try {
    return readdirSync(commandsDir)
      .filter(f => f.endsWith(".md"))
      .map(f => f.replace(".md", ""));
  } catch {
    return [];
  }
}

export function getAvailableSkills(): string[] {
  const root = getProjectRoot();
  const skillsDir = join(root, "skills");

  try {
    return readdirSync(skillsDir)
      .filter(f => {
        const skillPath = join(skillsDir, f);
        return statSync(skillPath).isDirectory();
      });
  } catch {
    return [];
  }
}

export function getCommandOptions() {
  const commands = getAvailableCommands();
  const root = getProjectRoot();

  return commands.map(cmd => {
    const cmdPath = join(root, "commands", `${cmd}.md`);
    const content = readFile(cmdPath);

    // Extract description from frontmatter
    const match = content.match(/^---\s*\n[\s\S]*?description:\s*(.+?)\n[\s\S]*?---/);
    const description = match?.[1] || cmd;

    return {
      value: cmd,
      label: cmd,
      hint: description,
    };
  });
}

export function getSkillOptions() {
  const skills = getAvailableSkills();
  const root = getProjectRoot();

  return skills.map(skill => {
    const skillPath = join(root, "skills", skill, "SKILL.md");
    let description = skill;

    try {
      const content = readFile(skillPath);
      const match = content.match(/^---\s*\n[\s\S]*?description:\s*(.+?)\n[\s\S]*?---/);
      description = match?.[1] || skill;
    } catch {
      // Use default
    }

    return {
      value: skill,
      label: skill,
      hint: description,
    };
  });
}

export interface InstallClaudeOptions {
  targetDir: string;
  commands: string[];
  skills: string[];
}

export function installClaude(options: InstallClaudeOptions) {
  const { targetDir, commands, skills } = options;
  const root = getProjectRoot();

  // Install commands
  if (commands.length > 0) {
    const targetCommandsDir = join(targetDir, ".claude", "commands");
    ensureDir(targetCommandsDir);

    for (const cmd of commands) {
      const src = join(root, "commands", `${cmd}.md`);
      const dest = join(targetCommandsDir, `${cmd}.md`);

      if (fileExists(dest)) {
        printInfo(`Skipping ${cmd}.md (already exists)`);
        continue;
      }

      copyFile(src, dest);
      printSuccess(`Added command: ${cmd}`);
    }
  }

  // Install skills
  if (skills.length > 0) {
    for (const skill of skills) {
      const srcDir = join(root, "skills", skill);
      const destDir = join(targetDir, ".claude", "skills", skill);

      if (fileExists(join(destDir, "SKILL.md"))) {
        printInfo(`Skipping skill ${skill} (already exists)`);
        continue;
      }

      ensureDir(destDir);

      // Copy all files in the skill directory
      const files = readdirSync(srcDir);
      for (const file of files) {
        const srcPath = join(srcDir, file);
        const destPath = join(destDir, file);

        if (statSync(srcPath).isFile()) {
          copyFile(srcPath, destPath);
        }
      }

      printSuccess(`Added skill: ${skill}`);
    }
  }
}
