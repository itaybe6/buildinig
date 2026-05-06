#!/usr/bin/env node
/**
 * scripts/pull-branding.mjs <Client>
 *
 * Placeholder hook for pulling branding assets from a remote source
 * (e.g. Supabase Storage, S3, internal HTTP endpoint).
 *
 * Configure BRANDING_PULL_URL in your environment, then this script
 * will fetch a tarball/zip and unpack it into branding/<Client>/.
 *
 * Until you wire up a remote source, this script just verifies that
 * branding/<Client>/ exists and prints what would be pulled.
 */
import fs from "node:fs";
import path from "node:path";
import { brandingDir, listClients } from "./_common.mjs";

function main() {
  const client = process.argv[2];

  if (!client) {
    console.error("Usage: node scripts/pull-branding.mjs <Client>");
    console.error("Available clients: " + (listClients().join(", ") || "<none>"));
    process.exit(1);
  }

  const remote = process.env.BRANDING_PULL_URL;
  const dir = brandingDir(client);
  fs.mkdirSync(dir, { recursive: true });

  if (!remote) {
    console.warn(
      "ℹ️  BRANDING_PULL_URL is not set. Wire up your remote source (Supabase Storage, S3, etc.)\n" +
        `   Local target would be: ${dir}`
    );
    return;
  }

  console.log(`Pulling branding for "${client}" from: ${remote}`);
  console.log("⚠️  Remote pull not implemented yet. Add fetch+extract logic in scripts/pull-branding.mjs.");
}

main();
