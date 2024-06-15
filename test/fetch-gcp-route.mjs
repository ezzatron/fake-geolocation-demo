const token = process.env.GCP_ROUTES_API_KEY;
if (!token) {
  throw new Error("Missing GCP_ROUTES_API_KEY");
}

const baseURL = new URL("https://routes.googleapis.com/");

const travelMode = "TRANSIT";
const steps = [
  "White Castle, Webster Avenue, The Bronx, NY",
  "Five Guys, Hudson Street, Jersey City, NJ",
  // "11 Madison Ave, New York, NY 10010, United States", // transit only allows 2 stops
];
const departureTime = new Date(Date.now() + 60 * 1000);

const result = await directions(travelMode, steps, departureTime);

console.log(JSON.stringify(result));

console.error("Legs:", result.routes?.[0].legs.length);

async function directions(travelMode, stops, departureTime) {
  const origin = stops.shift();
  const destination = stops.pop();

  const res = await fetch(
    new URL(["directions", "v2:computeRoutes"].join("/"), baseURL),
    {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": token,
        "X-Goog-FieldMask":
          "routes.legs.steps.staticDuration,routes.legs.steps.polyline",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        travelMode,
        routingPreference:
          travelMode === "TRANSIT" ? undefined : "TRAFFIC_AWARE",
        origin: { address: origin },
        destination: { address: destination },
        intermediates: stops.map((address) => ({ address })),
        departureTime: departureTime.toISOString(),
        polylineQuality: "HIGH_QUALITY",
        polylineEncoding: "GEO_JSON_LINESTRING",
        units: "METRIC",
      }),
    },
  );

  const body = await res.json();

  if (!res.ok) {
    throw new Error(
      `Unexpected response code: ${res.status} ${res.statusText} ${JSON.stringify(body, null, 2)}`,
    );
  }

  return body;
}
