import { getCurrentDate } from "./get-current-date";

export const parseHwid = (hwid: number[]): string => {
  const { year, month, day, hour } = getCurrentDate();

  return String.fromCharCode(...hwid.map((value) => value / (year * month * day * hour)));
};
