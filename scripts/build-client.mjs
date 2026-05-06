#!/usr/bin/env node
/**
 * scripts/build-client.mjs <Client> <ios|android|all>
 *
 * Runs `eas build` for a specific client. Requires EAS CLI installed and authenticated.
 */
import { spawn } from "node:child_process";
import { assertClientExists } from "./_common.mjs";

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
      cwd: process.cwd(),
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  const client = process.argv[2];
  const target = process.argv[3];

  if (!client || !target) {
    console.error("Usage: node scripts/build-client.mjs <Client> <ios|android|all>");
    process.exit(1);
  }
  if (!["ios", "android", "all"].includes(target)) {
    console.error(`Invalid target "${target}". Use ios, android, or all.`);
    process.exit(1);
  }

  assertClientExists(client);
  process.chdir("apps/mobile");

  const env = { CLIENT: client };

  if (target === "all") {
    await Promise.all([
      run("eas", ["build", "--platform", "ios", "--profile", client], env),
      run("eas", ["build", "--platform", "android", "--profile", client], env),
    ]);
  } else {
    await run("eas", ["build", "--platform", target, "--profile", client], env);
  }

  console.log(`✅ Build dispatched for ${client} (${target})`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
