import goProTelemetry from "gopro-telemetry";
import GPMFExtract from "gpmf-extract";
import { createReadStream } from "node:fs";
import { basename } from "node:path";

const [, scriptName, ...args] = process.argv;
const [filePath] = args;

if (!filePath) {
  throw new Error(`Usage: ${basename(scriptName)} <path to video file>`);
}

const GPMF = await GPMFExtract((file) => {
  const stream = createReadStream(filePath, { highWaterMark: 1 << 16 });
  let bytesRead = 0;

  stream.on("end", () => {
    file.flush();
  });

  stream.on("data", (chunk) => {
    const arrayBuffer = new Uint8Array(chunk).buffer;
    arrayBuffer.fileStart = bytesRead;
    file.appendBuffer(arrayBuffer);
    bytesRead += chunk.length;
  });

  stream.resume();
});

const telemetry = await goProTelemetry(GPMF, {
  decimalPlaces: 6,
  disableInterpolation: true,
  disableMerging: true,
  preset: "geojson",
  repeatSticky: false,
  smooth: false,
});

const { properties } = telemetry;
const { AbsoluteUtcMicroSec } = properties;
delete properties.device;
delete properties.geoidHeight;
delete properties.AbsoluteUtcMicroSec;
delete properties.RelativeMicroSec;
properties.coordinateProperties = { times: AbsoluteUtcMicroSec };

console.log(JSON.stringify(telemetry));
