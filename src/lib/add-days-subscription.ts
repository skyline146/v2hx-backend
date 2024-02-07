import { UserRowDto } from "src/users/dtos";

export const addDaysToSubscription = (user: UserRowDto, days: number) => {
  if (user.subscription_type === "Lifetime") {
    return "Lifetime";
  } else {
    return new Date(
      new Date(user.expire_date).getTime() + days * 24 * 60 * 60 * 1000
    ).toISOString();
  }
};
