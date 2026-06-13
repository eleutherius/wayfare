export type PlaceCategory =
  | "coffee"
  | "food"
  | "sight"
  | "viewpoint"
  | "stay"
  | "other";

export interface MarkerData {
  lat: number;
  lng: number;
  title: string;
  slug: string;
  category: PlaceCategory;
  city?: string;
  rating?: number;
  excerpt?: string;
  googleUrl: string;
  appleUrl: string;
}

export interface TrackData {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
