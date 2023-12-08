export const checkSubscription = (expire_Date: string) => {
  const expire_date = new Date(expire_Date);
  if (expire_Date !== "Lifetime" && (!expire_Date || expire_date.getTime() < Date.now())) {
    return false;
  }

  return true;
};
