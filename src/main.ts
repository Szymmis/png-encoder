import { readFile, writeFileSync } from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import { Image } from "./image";

readFile("img.png", {}, (err, data) => {
  if (err) console.log(err);
  else {
    let img = new Image(data);
    img
      .shade(10, 78, 125)
      .onEveryPixel((x, y) => {
        if (y % 2 == 0) img.set(x, y, { r: 255, g: 255, b: 255, a: 255 });
      })
      .convolute([
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ])
      .saveToFile("saved.png");
  }
});
