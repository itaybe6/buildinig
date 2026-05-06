#!/usr/bin/env node
/**
 * scripts/add-client.mjs <NewClient> [--from Default]
 *
 * Creates a new branding folder by copying an existing template client (default: "Default"),
 * adds package.json scripts at the repo root, and registers an EAS profile in apps/mobile/eas.json.
 *
 * After running:
 *  1. Edit branding/<NewClient>/.env with real Supabase URL, anon key, BUSINESS_ID.
 *  2. Replace icon.png / splash.png / logo.png / favicon.png in branding/<NewClient>/.
 *  3. Add a require() entry for the client in apps/mobile/src/theme/assets.ts.
 *  4. Insert <NewClient>'s real EAS_PROJECT_ID in apps/mobile/eas.json.
 *  5. Insert a tenants row in Supabase using the same UUID as BUSINESS_ID.
 */
import fs from "node:fs";
import path from "node:path";
import {
  brandingDir,
  brandingRoot,
  copyDirSync,
  listClients,
  mobileRoot,
  readJson,
  repoRoot,
  writeJson,
} from "./_common.mjs";

function parseArgs(argv) {
  const args = { client: null, from: "Default" };
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") {
      args.from = argv[++i];
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      positionals.push(a);
    }
  }
  args.client = positionals[0];
  return args;
}

function isValidName(name) {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(name);
}

function addRootScripts(client) {
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = readJson(pkgPath);
  pkg.scripts = pkg.scripts ?? {};

  const mobileStart = `cross-env CLIENT=${client} pnpm --filter @my-project/mobile run dev`;
  const webStart = `cross-env CLIENT=${client} pnpm --filter @my-project/web run dev`;

  const updates = {
    [`switch:${client}`]: `node scripts/switch-client.mjs ${client}`,
    [`start:${client}`]: `node scripts/switch-client.mjs ${client} && ${mobileStart} -- --tunnel`,
    [`start:${client}:lan`]: `node scripts/switch-client.mjs ${client} && ${mobileStart} -- --lan`,
    [`start:${client}:localhost`]: `node scripts/switch-client.mjs ${client} && ${mobileStart} -- --localhost`,
    [`start:web:${client}`]: `node scripts/switch-client.mjs ${client} && ${webStart}`,
    [`build:${client}:ios`]: `node scripts/build-client.mjs ${client} ios`,
    [`build:${client}:android`]: `node scripts/build-client.mjs ${client} android`,
    [`build:${client}:all`]: `node scripts/build-client.mjs ${client} all`,
  };

  for (const [k, v] of Object.entries(updates)) {
    if (!pkg.scripts[k]) pkg.scripts[k] = v;
  }

  writeJson(pkgPath, pkg);
  console.log(`✅ Added scripts to package.json: start:${client}, start:web:${client}, build:${client}:*`);
}

function addEasProfile(client) {
  const easPath = path.join(mobileRoot, "eas.json");
  let eas;
  if (fs.existsSync(easPath)) {
    eas = readJson(easPath);
  } else {
    eas = { cli: { version: ">= 5.0.0" }, build: {} };
  }
  eas.build = eas.build ?? {};
  if (!eas.build[client]) {
    eas.build[client] = {
      node: "20.19.4",
      autoIncrement: true,
      env: {
        CLIENT: client,
        ENV_FILE: `branding/${client}/.env`,
        EAS_PROJECT_ID: "REPLACE_ME_WITH_EXPO_PROJECT_ID",
        RCT_NEW_ARCH_ENABLED: "1",
      },
    };
    writeJson(easPath, eas);
    console.log(`✅ Added EAS profile "${client}" to apps/mobile/eas.json`);
  } else {
    console.log(`ℹ️  EAS profile "${client}" already exists; left untouched`);
  }
}

function main() {
  const { client, from } = parseArgs(process.argv.slice(2));

  if (!client) {
    console.error("Usage: node scripts/add-client.mjs <NewClient> [--from Default]");
    process.exit(1);
  }
  if (!isValidName(client)) {
    console.error(`Invalid client name "${client}". Use [A-Za-z][A-Za-z0-9_-]*`);
    process.exit(1);
  }

  const target = brandingDir(client);
  if (fs.existsSync(target)) {
    console.error(`branding/${client}/ already exists.`);
    process.exit(1);
  }

  const source = brandingDir(from);
  if (!fs.existsSync(source)) {
    console.error(`Template client "${from}" not found at ${source}`);
    console.error(`Available: ${listClients().join(", ") || "<none>"}`);
    process.exit(1);
  }

  copyDirSync(source, target);
  console.log(`✅ Created branding/${client}/ (copied from ${from}/)`);

  const envFile = path.join(target, ".env");
  if (fs.existsSync(envFile)) {
    fs.rmSync(envFile);
    console.log(`   removed copied .env (you'll add a fresh one with real secrets)`);
  }

  const examplePath = path.join(target, ".env.example");
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envFile);
    console.log(`   created branding/${client}/.env from .env.example (fill in real values)`);
  }

  const mobileConfigPath = path.join(target, "app.config.json");
  if (fs.existsSync(mobileConfigPath)) {
    const m = readJson(mobileConfigPath);
    m.shortName = client;
    m.slug = `my-project-mobile-${client.toLowerCase()}`;
    m.scheme = `myproject-${client.toLowerCase()}`;
    m.ios = m.ios ?? {};
    m.ios.bundleIdentifier = `com.myproject.${client.toLowerCase()}`;
    m.android = m.android ?? {};
    m.android.package = `com.myproject.${client.toLowerCase()}app`;
    writeJson(mobileConfigPath, m);
    console.log(`   updated branding/${client}/app.config.json (slug/scheme/bundleId)`);
  }

  addRootScripts(client);
  addEasProfile(client);

  console.log("");
  console.log(`Next steps:`);
  console.log(`  1. Edit branding/${client}/.env (BUSINESS_ID, SUPABASE_URL, ANON_KEY)`);
  console.log(`  2. Replace icon.png / splash.png / logo*.png / favicon.png in branding/${client}/`);
  console.log(`  3. Add a require() row for "${client}" in apps/mobile/src/theme/assets.ts`);
  console.log(`  4. Set EAS_PROJECT_ID in apps/mobile/eas.json profile "${client}"`);
  console.log(`  5. Insert tenants row in Supabase with id == BUSINESS_ID`);
  console.log(`  6. Run: npm run start:${client}`);
}

main();
