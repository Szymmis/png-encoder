import { calcAverage } from "./pixel";
import { fourBytesToNumber, numberAsFourBytes } from "./io";
import { Chunk, getChunks, writeChunk, writeChunkBuffer } from "./chunk";

import zlib from "zlib";

enum FilterType {
  NONE = 0,
  SUB = 1,
  UP = 2,
  AVERAGE = 3,
  PAETH = 4,
}

function paeth(a: number, b: number, c: number) {
  let p = a + b - c;
  let pa = Math.abs(p - a);
  let pb = Math.abs(p - b);
  let pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) return a;
  else if (pb <= pc) return b;
  else return c;
}

export type ImageOptions = {
  width: number;
  height: number;
  bitDepth?: number;
  colorType?: number;
  compression?: number;
  filterType?: number;
  interlace?: number;
};

// export type Scanline = {
//   filter: number;
//   pixels: Pixel[];
// };

export type RGB = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export class Image {
  private chunks: Chunk[] = [];
  private options: ImageOptions = { width: 0, height: 0 };
  // private scanlines: Scanline[] = [];
  private data: Buffer = Buffer.alloc(0);

  constructor(data: Buffer) {
    this.load(data);

    // for (let i = 0; i < this.scanlines.length; i++) {
    //   this.pixelData.push(this.scanlines[i].pixels);
    // }
  }

  private load(data: Buffer): void {
    let chunks = getChunks(data);
    let allData: number[] = [];
    console.time("load in image");
    for (let i = 0; i < chunks.length; i++) {
      const { name, data } = chunks[i];
      switch (name) {
        case "IHDR":
          this.options = {
            width: fourBytesToNumber([data[0], data[1], data[2], data[3]]),
            height: fourBytesToNumber([data[4], data[5], data[6], data[7]]),
            bitDepth: data[8],
            colorType: data[9],
            compression: data[10],
            filterType: data[11],
            interlace: data[12],
          };
          break;
        case "IDAT":
          data.forEach((e) => allData.push(e));
          break;
        // case "IEND":
        //   break;
        default:
          console.log("Unknown chunk", name);
          break;
      }
    }
    console.timeEnd("load in image");
    console.log(this.options);

    console.time("inflate");
    // this.readScanlinesAndDecode(
    //@ts-ignore
    this.data = zlib.inflateSync(Buffer.from(allData));
    //console.log(this.data);
    // );

    this.decode();

    // for(let i = 0; i < this.pixels.length; i++)
    //   this.pixels.writeUInt8(0xff, i)

    console.timeEnd("inflate");
  }

  getSize() {
    return { width: this.options.width, height: this.options.height };
  }

  private getLength() {
    return this.options.width * this.getBytesPerPixel() + 1;
  }

  private getBytesPerPixel() {
    return this.options.colorType == 6 ? 4 : 3;
  }

  private decode() {
    //const { scanlines } = this;
    const length = this.getLength();
    const bpp = this.getBytesPerPixel();
    for (let i = 0; i < this.data.length; i += length) {
      const filter = this.data[i];
      //Setting filterType to none because i don't make any encoding
      this.data[i] = FilterType.NONE;
      for (let j = i + 1; j < i + length; j += bpp) {
        switch (filter) {
          case FilterType.SUB:
            if (j - i > 3) {
              //X   +  LEFT
              this.data[j] += this.data[j - bpp]; // R
              this.data[j + 1] += this.data[j - bpp + 1]; // G
              this.data[j + 2] += this.data[j - bpp + 2]; // B
              if (bpp >= 4) this.data[j + 3] += this.data[j - bpp + 3]; // A
            }
            break;
          case FilterType.UP:
            if (j >= length) {
              //X   +   UP
              this.data[j] += this.data[j - length]; // R
              this.data[j + 1] += this.data[j - length + 1]; // G
              this.data[j + 2] += this.data[j - length + 2]; // B
              if (bpp >= 4) this.data[j + 3] += this.data[j - length + 3]; // A
            }
            break;
          case FilterType.AVERAGE:
            if (j - i > 3 && i >= length) {
              let a1 = bpp >= 4 ? this.data[j - bpp + 3] : 255;
              let a2 = bpp >= 4 ? this.data[j - length + 3] : 255;
              let avg = calcAverage(
                {
                  r: this.data[j - bpp],
                  g: this.data[j - bpp + 1],
                  b: this.data[j - bpp + 2],
                  a: a1,
                },
                {
                  r: this.data[j - length],
                  g: this.data[j - length + 1],
                  b: this.data[j - length + 2],
                  a: a2,
                }
              );
              this.data[j] += avg.r; // R
              this.data[j + 1] += avg.g; // G
              this.data[j + 2] += avg.b; // B
              if (bpp >= 4) this.data[j + 3] += avg.a;
            }
            break;
          case FilterType.PAETH:
            this.data[j] += paeth(
              this.data[j - bpp],
              this.data[j - length],
              this.data[j - length - bpp]
            ); // R
            this.data[j + 1] += paeth(
              this.data[j - bpp + 1],
              this.data[j - length + 1],
              this.data[j - length - bpp + 1]
            ); // G
            this.data[j + 2] += paeth(
              this.data[j - bpp + 2],
              this.data[j - length + 2],
              this.data[j - length - bpp + 2]
            ); // B
            if (bpp >= 4) {
              this.data[j + 3] += paeth(
                this.data[j - bpp + 3],
                this.data[j - length + 3],
                this.data[j - length - bpp + 3]
              ); // A
            }
            break;
        }
      }
    }
  }

  writeToBuffer() {
    let IHDR = writeChunk("IHDR", [
      ...numberAsFourBytes(this.options.width),
      ...numberAsFourBytes(this.options.height),
      this.options.bitDepth || 0,
      this.options.colorType || 0,
      this.options.compression || 0,
      this.options.filterType || 0,
      this.options.interlace || 0,
    ]);
    console.time("deflate");
    let output = zlib.deflateSync(this.data);
    console.timeEnd("deflate");
    //@ts-ignore
    let IDAT = writeChunk("IDAT", output);
    let IEND = writeChunk("IEND", []);

    return Buffer.from([
      137,
      80,
      78,
      71,
      13,
      10,
      26,
      10,
      ...IHDR,
      ...IDAT,
      ...IEND,
    ]);
  }

  get(x: number, y: number): RGB {
    const length = this.getLength();
    const bpp = this.getBytesPerPixel();

    return {
      r: this.data[length * y + 1 + x * bpp],
      g: this.data[length * y + 1 + x * bpp + 1],
      b: this.data[length * y + 1 + x * bpp + 2],
      a: bpp >= 4 ? this.data[length * y + 1 + x * bpp + 3] : 255,
    };
  }

  set(x: number, y: number, rgb: RGB): void {
    const length = this.getLength();
    const bpp = this.getBytesPerPixel();

    this.data[length * y + 1 + x * bpp] = Math.max(Math.min(rgb.r, 255), 0);
    this.data[length * y + 1 + x * bpp + 1] = Math.max(Math.min(rgb.g, 255), 0);
    this.data[length * y + 1 + x * bpp + 2] = Math.max(Math.min(rgb.b, 255), 0);
    if (bpp >= 4)
      this.data[length * y + 1 + x * bpp + 3] = Math.max(
        Math.min(rgb.a, 255),
        0
      );
  }

  onEveryPixel(func: (x: number, y: number, rgb: RGB) => void): void {
    for (let i = 0; i < this.options.height; i++) {
      for (let j = 0; j < this.options.width; j++) {
        func(j, i, this.get(j, i));
      }
    }
  }

  grayscale() {
    this.onEveryPixel((x, y, rgb) => {
      const avg = (rgb.r + rgb.g + rgb.b) / 3;
      this.set(x, y, { r: avg, g: avg, b: avg, a: rgb.a });
    });
  }

  convolute(matrix: number[][]) {
    // let copy = [...this.pixelData];
    // let divider = 0;
    // for (let i = 0; i < matrix.length; i++) {
    //   for (let j = 0; j < matrix[i].length; j++) divider += matrix[i][j];
    // }
    // console.log(divider);
    // let size = matrix.length;
    // if (size % 2 == 1) {
    //   let radius: number = (size - 1) / 2;
    //   for (let i = radius; i < this.pixelData.length - radius; i++) {
    //     for (let j = radius; j < this.pixelData[i].length - radius; j++) {
    //       let sumR = 0;
    //       let sumG = 0;
    //       let sumB = 0;
    //       for (let k = 0; k < size; k++) {
    //         for (let l = 0; l < size; l++) {
    //           sumR +=
    //             matrix[k][l] * this.pixelData[i + k - radius][j + l - radius].r;
    //           sumG +=
    //             matrix[k][l] * this.pixelData[i + k - radius][j + l - radius].g;
    //           sumB +=
    //             matrix[k][l] * this.pixelData[i + k - radius][j + l - radius].b;
    //         }
    //       }
    //       if (divider != 0) {
    //         sumR /= divider;
    //         sumG /= divider;
    //         sumB /= divider;
    //       }
    //       copy[i][j] = new Pixel(sumR, sumG, sumB);
    //     }
    //   }
    //   this.pixelData = copy;
    // }
  }
}
