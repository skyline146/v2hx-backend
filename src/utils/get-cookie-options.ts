import { CookieSerializeOptions } from "@fastify/cookie";

type Cookies = "accessToken" | "refreshToken";

const cookiePeriods: Record<Cookies, number> = {
  accessToken: 15 * 60 * 1000,
  refreshToken: 7 * 24 * 60 * 60 * 1000,
};

const cookiePaths: Record<Cookies, string> = {
  accessToken: "/api",
  refreshToken: "/api/auth",
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
