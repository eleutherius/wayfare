export const config = {
  site: {
    name: "Wayfare",
    description: "A personal travel map",
  },

  /** Cities visible in production. In dev mode all cities are shown regardless. */
  publishedCities: ["Bangkok"],

  /** City selected by default on the home page. */
  defaultCity: "Bangkok",

  show: {
    /** Routes section in sidebar and route pages. */
    routes: true,
    /** Star ratings on place pages. */
    ratings: true,
    /** "About this project" link in sidebar + about page. */
    aboutPage: true,
    /** Category links on place detail pages. */
    categoryLinks: true,
    /** Google Maps / Apple Maps links on place pages. */
    mapLinks: true,
    /** "Print / PDF" button on route pages. */
    printButton: true,
  },
};
