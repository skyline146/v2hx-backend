export const parseHwid = (hwid: number[], magicValue: number): string => {
  return String.fromCharCode(...hwid.map((value) => value / magicValue));
};
