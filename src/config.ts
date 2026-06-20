export const config = {
  site: {
    name: "Wayfare",
    description: "A personal travel map",
  },

  publishedCities: ["Bangkok"],

  defaultCity: "Bangkok",

  categories: {
    coffee:      { emoji: "☕", label: "Coffee" },
    food:        { emoji: "🍜", label: "Food" },
    sight:       { emoji: "🏛️", label: "Sight" },
    viewpoint:   { emoji: "🌅", label: "Viewpoint" },
    stay:        { emoji: "🏨", label: "Stay" },
    nightlife:   { emoji: "🍸", label: "Nightlife" },
    nightmarket: { emoji: "🛍️", label: "Night Market" },
    rooftopbar:  { emoji: "🍹", label: "Rooftop Bar" },
    sportplace:  { emoji: "⚽", label: "Sport" },
    mall:        { emoji: "🛒", label: "Shopping Mall" },
    other:       { emoji: "📍", label: "Other" },
  } as Record<string, { emoji: string; label: string }>,

  show: {
    routes: true,
    ratings: true,
    aboutPage: true,
    categoryLinks: true,
    mapLinks: true,
    printButton: true,
  },
};
