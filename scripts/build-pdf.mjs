#!/usr/bin/env node
/**
 * Generates a PDF from a route's print view using Playwright.
 * Automatically starts the dev server if none is running.
 *
 * Usage:
 *   node scripts/build-pdf.mjs <route-slug> [output.pdf]
 *
 * Options:
 *   --base-url  Base URL of the running site (default: http://localhost:4321)
 *   --base      Astro base path (default: "")
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";

const AUTO_PORT = 4399;

function parseArgs(argv) {
  const args = { slug: null, output: null, baseUrl: null, base: "" };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--") {
      continue;
    } else if (rest[i] === "--base-url") {
      args.baseUrl = rest[++i];
    } else if (rest[i] === "--base") {
      args.base = rest[++i];
    } else if (!args.slug) {
      args.slug = rest[i].replace(/\.pdf$/i, "");
    } else if (!args.output) {
      args.output = rest[i];
    }
  }

  return args;
}

function ping(url) {
  return new Promise((resolve) => {
    http
      .get(url, (res) => {
        res.resume();
        resolve(true);
      })
      .on("error", () => resolve(false))
      .setTimeout(1000, function () {
        this.destroy();
      });
  });
}

async function waitForServer(url, ms = 30_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await ping(url)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

// ── Main ────────────────────────────────────────────────────────────────────

const { slug, output, baseUrl: explicitBaseUrl, base } = parseArgs(process.argv);

if (!slug) {
  console.error(
    "Usage: node scripts/build-pdf.mjs <route-slug> [output.pdf] [--base-url URL] [--base PATH]"
  );
  process.exit(1);
}

// Determine server URL: use explicit --base-url, or default 4321, or auto-start on 4399
let baseUrl = explicitBaseUrl ?? "http://localhost:4321";
let devProcess = null;

if (!explicitBaseUrl) {
  const running = await ping(baseUrl);
  if (!running) {
    console.log("No server detected — starting dev server on port " + AUTO_PORT + "…");
    baseUrl = `http://localhost:${AUTO_PORT}`;
    devProcess = spawn("pnpm", ["dev", "--port", String(AUTO_PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });
    devProcess.stderr.on("data", () => {}); // suppress output

    const ready = await waitForServer(baseUrl);
    if (!ready) {
      devProcess.kill();
      console.error("Dev server failed to start within 30 s.");
      process.exit(1);
    }
    console.log("Dev server ready.");
  }
}

const printUrl = `${baseUrl}${base}/routes/${slug}.print`;
const outputPath = resolve(output ?? `${slug}.pdf`);

mkdirSync(dirname(outputPath), { recursive: true });

console.log(`Opening: ${printUrl}`);

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(printUrl, { waitUntil: "domcontentloaded" });

// Wait for Leaflet tiles to appear, then let remaining requests settle
await page
  .waitForFunction(() => document.querySelectorAll(".leaflet-tile-loaded").length > 0, {
    timeout: 10_000,
  })
  .catch(() => {});
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(300);

await page.pdf({
  path: outputPath,
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", right: "20mm", bottom: "22mm", left: "20mm" },
});

await browser.close();

if (devProcess) devProcess.kill();

console.log(`✓ PDF written to ${outputPath}`);
