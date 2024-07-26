import GPMFExtract from "gpmf-extract";
import { createReadStream } from "node:fs";
import { basename } from "node:path";

const [, scriptName, ...args] = process.argv;
const [filePath] = args;

if (!filePath) {
  throw new Error(`Usage: ${basename(scriptName)} <path to video file>`);
}

const GPMF = await GPMFExtract(bufferAppender(filePath, 1 << 16));

console.log("Length of data received:", GPMF.rawData.length);
console.log("Framerate of data received:", 1 / GPMF.timing.frameDuration);

function bufferAppender(path, chunkSize) {
  return function (mp4boxFile) {
    var stream = createReadStream(path, { highWaterMark: chunkSize });
    var bytesRead = 0;
    stream.on("end", () => {
      mp4boxFile.flush();
    });
    stream.on("data", (chunk) => {
      var arrayBuffer = new Uint8Array(chunk).buffer;
      arrayBuffer.fileStart = bytesRead;
      mp4boxFile.appendBuffer(arrayBuffer);
      bytesRead += chunk.length;
    });
    stream.resume();
  };
}
