export const getCurrentDate = () => {
  const currDate = new Date(),
    year = currDate.getUTCFullYear(),
    month = currDate.getUTCMonth() + 1,
    day = currDate.getUTCDate(),
    hour = currDate.getUTCHours() === 0 ? 24 : currDate.getUTCHours();

  return { year, month, day, hour };
};
