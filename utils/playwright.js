import { execSync } from "child_process";

export function installChromium() {
  try {
    console.log("Checking Playwright Chromium installation...");
    execSync("npx playwright install chromium", { stdio: "inherit" });
    console.log("Chromium is installed for Playwright.");
  } catch (error) {
    console.error("Failed to install Chromium for Playwright:", error);
    process.exit(1);
  }
}