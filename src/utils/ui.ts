import gradient from "gradient-string";
import pc from "picocolors";
import chalkAnimation from "chalk-animation";
import { createSpinner } from "nanospinner";
import boxen from "boxen";

const BANNER = `
   ___   ____  __ __
  / _ | / __ \\/ //_/
 / __ |/ /_/ / ,<
/_/ |_|\\____/_/|_|
`;

export async function printBanner(): Promise<void> {
  const coolGradient = gradient(["#6366f1", "#8b5cf6", "#a855f7"]);

  if (process.stdout.isTTY) {
    const anim = chalkAnimation.rainbow(BANNER);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    anim.stop();
    process.stdout.write("\x1B[5A\x1B[0J"); // Clear animation, reprint static
  }

  console.log(coolGradient(BANNER));
  console.log(pc.dim("  Bootstrap AI coding tools into your project\n"));
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

export function spinner(text: string) {
  return createSpinner(text).start();
}

export function printSuccessBox(lines: string[]) {
  console.log(
    boxen(lines.join("\n"), {
      padding: 1,
      borderStyle: "round",
      borderColor: "green",
    })
  );
}
