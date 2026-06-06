import { getCollection } from "astro:content";

/**
 * Called at build time from any page that renders routes.
 * Throws with a descriptive message if a stop references a place slug
 * that does not exist in the `places` collection.
 */
export async function validateRouteStops(
  routeSlug: string,
  stops: Array<{ place: string }>
): Promise<void> {
  const allPlaces = await getCollection("places");
  const placeSlugs = new Set(allPlaces.map((p) => p.id));

  const broken = stops
    .map((s) => s.place)
    .filter((slug) => !placeSlugs.has(slug));

  if (broken.length > 0) {
    throw new Error(
      `Route "${routeSlug}" references unknown place slug(s): ${broken.join(", ")}\n` +
        `Known slugs: ${[...placeSlugs].join(", ")}`
    );
  }
}
