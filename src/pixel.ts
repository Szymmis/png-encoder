import { RGB } from "./image";

export function calcAverage(rgb1: RGB, rgb2: RGB): RGB {
  return {
    r: Math.floor((rgb1.r + rgb2.r) / 2),
    g: Math.floor((rgb1.g + rgb2.g) / 2),
    b: Math.floor((rgb1.b + rgb2.b) / 2),
    a: Math.floor(((rgb1.a || 255) + (rgb2.a || 255)) / 2),
  };
}
