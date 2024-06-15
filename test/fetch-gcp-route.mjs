const token = process.env.GCP_ROUTES_API_KEY;
if (!token) {
  throw new Error("Missing GCP_ROUTES_API_KEY");
}

const baseURL = new URL("https://routes.googleapis.com/");

const steps = [
  "White Castle, Bronx, NY",
  "Five Guys, Jersey City, NJ",
  // "Shake Shack, New York, NY",
];

const result = await directions("TRANSIT", steps, new Date());

console.log(JSON.stringify(result));

// console.error("Legs:", result.routes[0].legs.length);
// console.error("Coordinates:", result.routes[0].geometry.coordinates.length);
// console.error(
//   "Durations:",
//   result.routes[0].legs.reduce(
//     (acc, leg) => acc + leg.annotation.duration.length,
//     0,
//   ),
// );

async function directions(travelMode, stops, departureTime) {
  const origin = stops.shift();
  const destination = stops.pop();

  const res = await fetch(
    new URL(["directions", "v2:computeRoutes"].join("/"), baseURL),
    {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": token,
        "X-Goog-FieldMask": "routes",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        travelMode,
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
