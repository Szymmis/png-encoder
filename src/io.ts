export function readFourBytesAsNumber(data: Buffer, offset: number): number {
  let bytes = [0, 0, 0, 0];
  if (offset < data.length) {
    bytes = [
      data.readUInt8(offset),
      data.readUInt8(offset + 1),
      data.readUInt8(offset + 2),
      data.readUInt8(offset + 3),
    ];
  }
  return fourBytesToNumber(bytes);
}

export function fourBytesToNumber(bytes: number[]): number {
  return (
    2 ** 24 * bytes[0] +
    2 ** 16 * bytes[1] +
    2 ** 8 * bytes[2] +
    2 ** 0 * bytes[3]
  );
}

export function numberAsFourBytes(n: number) {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function numberToChar(data: Buffer, offset: number) {
  return String.fromCharCode(data.readUInt8(offset));
}

export function readAsASCII(data: Buffer, offset: number) {
  return (
    numberToChar(data, offset) +
    numberToChar(data, offset + 1) +
    numberToChar(data, offset + 2) +
    numberToChar(data, offset + 3)
  );
}

export function writeAsASCII(str: string) {
  return str.split("").map((e: string) => {
    return e.charCodeAt(0);
  });
}
