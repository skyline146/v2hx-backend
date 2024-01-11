function swapBlocks(value: string) {
  //Мысленно разделим строку на блоки по 4 бита
  const first = value.substring(0, 4); //Запомнить первые 4 бита
  const third = value.substring(8, 12); //Запомнить первые 4 бита

  // value.replace(0, 4, value.substr(8, 4)); //Взять 4 бита начиная с 8 и заменить ими первые 4 бита (меняем третий и первый блок местами)
  // value.replace(8, 4, temp); //Заменить первый блок на третий
  return third + value.substring(4, 8) + first + value.substring(12);
}

function shiftBitsLeft(bits: string, shift: number) {
  return bits.substring(shift) + bits.substring(0, shift);
}

function bitsToInt(bitString: string) {
  let num = 0;

  for (let i = 0; i < bitString.length; i++) {
    const tempInt = parseInt(bitString[i], 10);
    num = num + tempInt * Math.pow(2, bitString.length - 1 - i);
  }

  return num;
}

export function decryptMagicValue(magicValue: string) {
  const swappedBlocks: string = swapBlocks(magicValue);

  const leftShiftBinaryArray: string = shiftBitsLeft(swappedBlocks, 2);

  const decryptedMagicValue: number = bitsToInt(leftShiftBinaryArray);

  return decryptedMagicValue;
}
