export const isXUID = (entry: string) => {
  const isXUID = /^([0-9]+)$/g.test(entry.toString());

  return isXUID ? `xuid(${entry})` : `gt(${encodeURIComponent(entry)})`;
};
