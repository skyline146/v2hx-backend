import { UserRowDto } from "src/users/dtos";

export const checkSubscription = (user: UserRowDto) => {
  if (
    user.subscription_type !== "Lifetime" &&
    (!user.subscription_type || new Date(user.expire_date).getTime() < Date.now())
  ) {
    return false;
  }

  return true;
};
