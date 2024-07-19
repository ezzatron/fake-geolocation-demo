const token = process.env.MAPBOX_TOKEN;
if (!token) {
  throw new Error("Missing MAPBOX_TOKEN");
}

const baseURL = new URL("https://api.mapbox.com/");

const profile = "driving";
const steps = [
  await geocode("White Castle, Webster Avenue, The Bronx, NY"),
  await geocode("Five Guys, Hudson Street, Jersey City, NJ"),
  await geocode("11 Madison Ave, New York, NY 10010, United States"),
];
const departAt = new Date();

const result = await directions(profile, steps, departAt);

console.log(JSON.stringify(result));

console.error("Steps:", steps);
console.error("Legs:", result.routes[0].legs.length);
console.error("Coordinates:", result.routes[0].geometry.coordinates.length);
console.error(
  "Durations:",
  result.routes[0].legs.reduce(
    (acc, leg) => acc + leg.annotation.duration.length,
    0,
  ),
);

async function geocode(query) {
  const url = new URL(
    ["search", "geocode", "v6", "forward"].join("/"),
    baseURL,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("q", query);

  const res = await fetch(url);
  const data = await res.json();

  return data.features[0].geometry.coordinates;
}

async function directions(profile, stops, departAt) {
  const url = new URL(
    [
      "directions",
      "v5",
      "mapbox",
      profile,
      stops.map((stop) => stop.join(",")).join(";"),
    ].join("/"),
    baseURL,
  );

  url.searchParams.set("access_token", token);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "true");
  url.searchParams.set("annotations", "duration");
  url.searchParams.set(
    "depart_at",
    departAt.toISOString().replace(/\.\d+Z$/, "Z"),
  );

  const res = await fetch(url);
  const body = await res.json();

  if (!res.ok) {
    throw new Error(
      `Unexpected response code: ${res.status} ${res.statusText} ${JSON.stringify(body, null, 2)}`,
    );
  }

  return body;
}
