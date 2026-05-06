#!/usr/bin/env node
/**
 * scripts/delete-branding.mjs <Client> [--yes]
 *
 * Deletes branding/<Client>/ AND removes its package.json scripts and EAS profile.
 * Use --yes to skip the confirmation prompt.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  brandingDir,
  mobileRoot,
  readCurrentClient,
  readJson,
  repoRoot,
  rmDirSync,
  writeJson,
} from "./_common.mjs";

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes");
    });
  });
}

function removeRootScripts(client) {
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = readJson(pkgPath);
  if (!pkg?.scripts) return;
  const prefixes = [
    `switch:${client}`,
    `start:${client}`,
    `start:web:${client}`,
    `build:${client}:`,
  ];
  let removed = 0;
  for (const key of Object.keys(pkg.scripts)) {
    if (prefixes.some((p) => key === p || key.startsWith(p))) {
      delete pkg.scripts[key];
      removed++;
    }
  }
  if (removed > 0) {
    writeJson(pkgPath, pkg);
    console.log(`✅ Removed ${removed} script(s) from package.json`);
  }
}

function removeEasProfile(client) {
  const easPath = path.join(mobileRoot, "eas.json");
  if (!fs.existsSync(easPath)) return;
  const eas = readJson(easPath);
  if (eas?.build?.[client]) {
    delete eas.build[client];
    writeJson(easPath, eas);
    console.log(`✅ Removed EAS profile "${client}"`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const client = args.find((a) => !a.startsWith("--"));
  const yes = args.includes("--yes") || args.includes("-y");

  if (!client) {
    console.error("Usage: node scripts/delete-branding.mjs <Client> [--yes]");
    process.exit(1);
  }

  const dir = brandingDir(client);
  if (!fs.existsSync(dir)) {
    console.error(`branding/${client}/ does not exist.`);
    process.exit(1);
  }

  if (!yes) {
    const ok = await confirm(
      `This will permanently delete branding/${client}/ and remove its scripts. Continue? (y/N) `
    );
    if (!ok) {
      console.log("Cancelled.");
      return;
    }
  }

  rmDirSync(dir);
  console.log(`✅ Deleted branding/${client}/`);
  removeRootScripts(client);
  removeEasProfile(client);

  if (readCurrentClient() === client) {
    console.log(`ℹ️  ${client} was the current client. Run: node scripts/switch-client.mjs Default`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
