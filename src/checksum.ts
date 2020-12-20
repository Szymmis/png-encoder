let crc_table = new Uint32Array(256);

let crc_computed = false;

export function makeTable() {
  for (let n = 0; n < crc_table.length; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      const value = 0xedb88320;
      if (c & 1) c = value ^ ((c >> 1) & 0x7fffffff);
      else c = (c >> 1) & 0x7fffffff;
    }
    crc_table[n] = c;
  }
  crc_computed = true;
}

export function crc(array: number[]) {
  if (!crc_computed) makeTable();
  let ar = new Uint32Array(1);
  ar[0] = 0xffffffff;
  for (let n = 0; n < array.length; n++) {
    ar[0] = crc_table[(ar[0] ^ array[n]) & 0xff] ^ ((ar[0] >> 8) & 0xffffff);
  }
  ar[0] = ar[0] ^ 0xffffffff;
  return ar[0];
}
