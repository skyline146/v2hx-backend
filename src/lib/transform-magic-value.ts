function swapBlocks(value: string) {
  const first = value.substring(0, 4);
  const third = value.substring(8, 12);

  return third + value.substring(4, 8) + first + value.substring(12);
}

function shiftBitsLeft(bits: string, shift: number) {
  return bits.substring(shift) + bits.substring(0, shift);
}

function shiftBitsRight(bits: string, shift: number) {
  return bits.substring(bits.length - shift) + bits.substring(0, bits.length - shift);
}

export function decryptMagicValue(magicValue: string) {
  const swappedBlocks: string = swapBlocks(magicValue);

  const leftShiftedBinary: string = shiftBitsLeft(swappedBlocks, 2);

  const decryptedMagicValue: number = parseInt(leftShiftedBinary, 2);

  return decryptedMagicValue;
}

export function encryptMagicValue(value: number) {
  const bitsStr = "0".repeat((4 - (value.toString(2).length % 4)) % 4) + value.toString(2);

  const rightShiftedBinary = shiftBitsRight(bitsStr, 2);

  const swappedBlocks = swapBlocks(rightShiftedBinary);

  return swappedBlocks;
}
