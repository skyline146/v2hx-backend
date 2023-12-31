import { UserRowDto } from "src/users/dtos";

export const invalidHwidsLog = (
  user: UserRowDto,
  login_hdd: string,
  login_mac_address: string,
  login_ip: string
) => {
  return `User ${user.username} failed to log in with invalid hwids. Warns: ${user.warn + 1}
  HDD: ${user.hdd}
  Login HDD: ${login_hdd}
  -------------------------------
  MAC Address: ${user.mac_address}
  Login MAC Address: ${login_mac_address}
  -------------------------------
  IP: ${user.ip}
  Login IP: ${login_ip}`;
};
