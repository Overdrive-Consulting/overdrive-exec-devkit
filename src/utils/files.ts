import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { dirname, join } from "path";

export function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

export function writeFile(path: string, content: string) {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf-8");
}

export function copyFile(src: string, dest: string) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

export function readJson<T = unknown>(path: string): T {
  const content = readFile(path);
  return JSON.parse(content) as T;
}

export function writeJson(path: string, data: unknown) {
  writeFile(path, JSON.stringify(data, null, 2) + "\n");
}

export function getProjectRoot(): string {
  // Find the ai-devkit root by looking for package.json with name "ai-devkit"
  // Use import.meta.url for Node compatibility (import.meta.dir is Bun-only)
  const currentFile = new URL(import.meta.url).pathname;
  let dir = dirname(currentFile);

  while (dir !== "/") {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = readJson<{ name: string }>(pkgPath);
        if (pkg.name === "@enteroverdrive/ai-devkit") {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    dir = dirname(dir);
  }
  throw new Error("Could not find ai-devkit root directory");
}
