import { crc } from "./checksum";
import {
  readFourBytesAsNumber,
  readAsASCII,
  numberAsFourBytes,
  writeAsASCII,
} from "./io";

export type Chunk = {
  length?: number;
  name: string;
  data: number[];
  size: number;
};

export function readChunk(buffer: Buffer, offset: number): Chunk {
  let length = readFourBytesAsNumber(buffer, offset);
  let name = readAsASCII(buffer, offset + 4);
  let data = [];

  if (name == "IDAT" || name == "IHDR") {
    for (let i = offset + 8; i < offset + 8 + length; i++) {
      data.push(buffer.readUInt8(i));
    }
  }
  return { name, data, size: 8 + length + 4 };
}

export function writeChunk(name: string, data: number[]): number[] {
  console.time("write chunk: " + name);
  let length = data.length;
  let bytes = [];
  bytes = [...numberAsFourBytes(length)];
  bytes = [...bytes, ...writeAsASCII(name)];
  bytes = [...bytes, ...data];
  let code = crc([...writeAsASCII(name), ...data]);
  bytes = [...bytes, ...numberAsFourBytes(code)];
  console.timeEnd("write chunk: " + name);
  return bytes;
}

export function writeChunkBuffer(name: string, buffer: Buffer): number[] {
  let data: number[] = [];
  buffer.forEach((e) => data.push(e));
  let length = data.length;
  let bytes = [];
  bytes = [...numberAsFourBytes(length)];
  bytes = [...bytes, ...writeAsASCII(name)];
  bytes = [...bytes, ...data];
  let code = crc([...writeAsASCII(name), ...data]);
  bytes = [...bytes, ...numberAsFourBytes(code)];
  return bytes;
}

export function getChunks(data: Buffer): Chunk[] {
  const chunks: Chunk[] = [];
  for (let i = 8; i < data.length; ) {
    let chunk = readChunk(data, i);
    chunks.push(chunk);
    if (chunk.size > 0 && chunk.size < data.length) i += chunk.size;
    else break;
  }
  return chunks;
}
