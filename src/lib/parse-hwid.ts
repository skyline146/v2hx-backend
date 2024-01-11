import { getCurrentDate } from "./get-current-date";

export const parseHwid = (hwid: number[], magicValue: number): string => {
  return String.fromCharCode(...hwid.map((value) => value / magicValue));
};
