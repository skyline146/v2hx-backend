import { CookieSerializeOptions } from "@fastify/cookie";

type Cookies = "access_token" | "refresh_token";

const cookiePeriods: Record<Cookies, number> = {
  access_token: 15 * 60 * 1000,
  refresh_token: 7 * 24 * 60 * 60 * 1000,
};

const cookiePaths: Record<Cookies, string> = {
  access_token: "/api",
  refresh_token: "/api/auth/refresh",
};

export const getCookieOptions = (name: string): CookieSerializeOptions => {
  return {
    httpOnly: true,
    secure: true,
    path: cookiePaths[name],
    sameSite: "strict",
    expires: new Date(Date.now() + cookiePeriods[name]),
  };
};
