import { encryptMagicValue } from "src/lib";
import { Offsets } from "../types";

function encrypt(value: number, magicValue: number) {
  return magicValue * value;
}

export function transformOffsets(json: Offsets, magicValue: number) {
  const newOffsets: Offsets = {};
  newOffsets["offset0"] = encryptMagicValue(magicValue);
  Object.keys(json).map((offset) => {
    newOffsets[offset] = encrypt(json[offset], magicValue);
  });

  return newOffsets;
}
