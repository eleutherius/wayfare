import { defineConfig } from "astro/config";

// Set BASE to your GitHub Pages project path, e.g. "/proizdom"
// For a user/org site (username.github.io) set it to ""
const BASE = process.env.BASE_PATH ?? "";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://example.github.io",
  base: BASE,
  output: "static",
  image: {
    // Astro built-in Sharp-based optimisation — no extra packages needed
  },
});
