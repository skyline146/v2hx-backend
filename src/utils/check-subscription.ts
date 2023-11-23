import { UnauthorizedException } from "@nestjs/common";

export const checkActiveSubscription = (expire_Date: string) => {
  const expire_date = new Date(expire_Date);
  if (expire_Date !== "Lifetime" && (!expire_Date || expire_date.getTime() < Date.now())) {
    throw new UnauthorizedException("You dont have active subscription");
  }
};
