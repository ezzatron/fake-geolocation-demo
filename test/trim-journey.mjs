import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const [, scriptName, ...args] = process.argv;
const [filePath, trimStartArg, trimEndArg] = args;

if (!filePath || !trimStartArg || !trimEndArg) {
  throw new Error(
    `Usage: ${basename(scriptName)} <path to journey file> <trim start ms> <trim end ms>`,
  );
}

const trimStart = parseInt(trimStartArg, 10);
const trimEnd = parseInt(trimEndArg, 10);

const data = await readFile(filePath, "utf-8");
const journey = JSON.parse(data);
const coordinates = journey?.geometry?.coordinates;
const times = journey?.properties?.coordinateProperties?.times;

if (!Array.isArray(coordinates) || !Array.isArray(times) || times.length < 1) {
  throw new TypeError("Invalid journey");
}

const endTime = times[times.length - 1];
const endCutoff = endTime - trimEnd;
const endIndex = times.findIndex((time) => time > endCutoff);

if (endIndex >= 0) {
  times.splice(endIndex);
  coordinates.splice(endIndex);
}

const startTime = times[0];
const startCutoff = startTime + trimStart;
const startIndex = times.findIndex((time) => time >= startCutoff);

if (startIndex >= 0) {
  times.splice(0, startIndex);
  coordinates.splice(0, startIndex);
}

console.log(JSON.stringify(journey));
