import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const places = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/places" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lat: z.number(),
      lng: z.number(),
      category: z.enum([
        "coffee",
        "food",
        "sight",
        "viewpoint",
        "stay",
        "nightlife",
        "nightmarket",
        "rooftopbar",
        "sportplace",
        "mall",
        "gallery",
        "museum",
        "temple",
        "bar",
        "rooftop",
        "coworking",
        "market",
        "other",
      ]),
      city: z.string(),
      date: z.coerce.date(),
      cover: image().optional(),
      rating: z.number().min(1).max(5).optional(),
      google_maps_url: z.string().url().optional(),
    }),
});

const stops = z.array(
  z.object({
    place: z.string(), // slug of an entry in `places`
    arrive: z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM"),
    stay: z.number().int().positive(), // minutes
    note: z.string().optional(),
  })
);

const routes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/routes" }),
  schema: z.object({
    title: z.string(),
    city: z.string(),
    mode: z.enum(["walking", "transit", "mixed"]),
    date: z.coerce.date().optional(),
    // relative path inside public/ or src/assets/, e.g. "tracks/morning-bangkok.geojson"
    track: z.string().optional(),
    stops,
  }),
});

export const collections = { places, routes };
