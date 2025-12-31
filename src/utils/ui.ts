import gradient from "gradient-string";
import pc from "picocolors";

const BANNER = `
   ___   ____  __ __
  / _ | / __ \\/ //_/
 / __ |/ /_/ / ,<
/_/ |_|\\____/_/|_|
`;

export function printBanner() {
  const coolGradient = gradient(["#6366f1", "#8b5cf6", "#a855f7"]);
  console.log(coolGradient(BANNER));
  console.log(
    pc.dim("  Bootstrap AI coding tools into your project\n")
  );
}

export function printSuccess(message: string) {
  console.log(pc.green("✓ ") + message);
}

export function printError(message: string) {
  console.log(pc.red("✗ ") + message);
}

export function printInfo(message: string) {
  console.log(pc.blue("ℹ ") + message);
}

export function printWarning(message: string) {
  console.log(pc.yellow("⚠ ") + message);
}

export function printStep(step: number, total: number, message: string) {
  console.log(pc.dim(`[${step}/${total}]`) + " " + message);
}
