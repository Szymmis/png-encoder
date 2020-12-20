import { readFile, writeFileSync } from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import { Image } from "./image";

readFile(process.argv[2] || "img.png", {}, (err, data) => {
  if (err) console.log(err);
  else {
    console.time("all");
    console.time("load");
    let img = new Image(data);
    console.timeEnd("load");
    // console.time("onEveryPixel");
    // img.set(0, 0, { r: 0, g: 255, b: 255 });
    img.grayscale();
    // console.timeEnd("onEveryPixel");
    // console.time("gray");
    // img.grayscale();
    // console.timeEnd("gray");
    // console.time("convolute");
    // // img.convolute([
    // //   [1, 1, 1, 1, 1, 1, 1],
    // //   [1, 1, 1, 1, 1, 1, 1],
    // //   [1, 1, 1, 1, 1, 1, 1],
    // //   [1, 1, 1, 1, 1, 1, 1],
    // //   [1, 1, 1, 1, 1, 1, 1],
    // //   [1, 1, 1, 1, 1, 1, 1],
    // //   [1, 1, 1, 1, 1, 1, 1],
    // // ]);
    // console.timeEnd("convolute");
    console.time("save");
    writeFileSync((process.argv[2] + "-modified.png") || "output.png", img.writeToBuffer());
    console.timeEnd("save");
    console.timeEnd("all");
  }
});
