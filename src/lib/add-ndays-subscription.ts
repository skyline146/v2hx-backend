export const addDaysToSubscription = (expire_date: string, days: number) => {
  if (expire_date === "Lifetime") {
    return "Lifetime";
  } else {
    return new Date(new Date(expire_date).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  }
};
