export const googleMaps = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const googleDirections = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export const appleMaps = (lat: number, lng: number, label: string): string =>
  `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`;
