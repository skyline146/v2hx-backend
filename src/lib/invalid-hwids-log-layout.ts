import { UserRowDto } from "src/users/dtos";

export const invalidHwidsLog = (user: UserRowDto, login_hdd: string, login_ip: string) => {
  return `User ${user.username} failed to log in. Warns: ${user.warn + 1}
  HDD: ${user.hdd}
  Login HDD: ${login_hdd}
  -------------------------------
  IP: ${user.ip}
  Login IP: ${login_ip}`;
};
