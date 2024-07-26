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

console.log("Length of data received:", GPMF.rawData.length);
console.log("Framerate of data received:", 1 / GPMF.timing.frameDuration);
