import { CookieOptions } from "express";

const cookiePeriods = {
  accessToken: 15 * 60 * 1000,
  refreshToken: 7 * 24 * 60 * 60 * 1000,
};

export const getCookieOptions = (cookie: string, path?: string): CookieOptions => {
  return {
    httpOnly: true,
    secure: true,
    path,
    sameSite: "strict",
    expires: new Date(Date.now() + cookiePeriods[cookie]),
  };
};
