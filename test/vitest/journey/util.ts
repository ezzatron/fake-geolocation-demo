const ZERO_COORDS: GeolocationCoordinates = {
  latitude: 0,
  longitude: 0,
  altitude: null,
  accuracy: 0,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

export function createCoordinates(
  coords: Partial<GeolocationCoordinates>,
): GeolocationCoordinates {
  return { ...ZERO_COORDS, ...coords };
}
