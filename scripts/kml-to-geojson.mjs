#!/usr/bin/env node
/**
 * KML → GeoJSON converter.
 *
 * Usage:
 *   node scripts/kml-to-geojson.mjs <input.kml> [output.geojson]
 *
 * Workflow:
 *   1. Draw your route in Google My Maps.
 *   2. Export as KML (Layer menu → Download KML).
 *   3. Run: node scripts/kml-to-geojson.mjs my-route.kml public/tracks/my-route.geojson
 *   4. In the route frontmatter set:  track: "tracks/my-route.geojson"
 *   5. Commit and push.
 *
 * Dependencies: @tmcw/togeojson, @xmldom/xmldom  (already in package.json devDeps)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, basename, extname } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error("Usage: node scripts/kml-to-geojson.mjs <input.kml> [output.geojson]");
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = outputArg
  ? resolve(outputArg)
  : resolve(
      dirname(inputPath),
      basename(inputPath, extname(inputPath)) + ".geojson"
    );

const kmlText = readFileSync(inputPath, "utf-8");
const dom = new DOMParser().parseFromString(kmlText, "text/xml");
const geojson = kml(dom);

// Remove null-geometry features (e.g. KML folders)
geojson.features = geojson.features.filter((f) => f.geometry != null);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(geojson, null, 2), "utf-8");

console.log(`✓ Converted ${inputPath}`);
console.log(`  → ${outputPath}`);
console.log(`  Features: ${geojson.features.length}`);
