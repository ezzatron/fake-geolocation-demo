const token = process.env.MAPBOX_TOKEN;
if (!token) {
  throw new Error("Missing MAPBOX_TOKEN");
}

const baseURL = new URL("https://api.mapbox.com/");

console.log(
  JSON.stringify(
    await directions("driving", [
      await geocode("White Castle, Bronx, NY"),
      await geocode("Five Guys, Jersey City, NJ"),
    ]),
  ),
);

async function geocode(query) {
  // https://api.mapbox.com/search/geocode/v6/forward?q={search_text}
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

async function directions(profile, stops) {
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
  url.searchParams.set("annotations", "duration");

  const res = await fetch(url);

  return res.json();
}
