import { UserRowDto } from "src/users/dtos";

export const invalidHwidsLog = (
  user: UserRowDto,
  login_hdd: string,
  login_mac_address: string,
  login_ip: string
) => {
  return `User ${user.username} ${
    login_mac_address ? `failed to log in.` : "logged in with no MAC Address."
  } Warns: ${user.warn + 1}
  HDD: ${user.hdd}
  Login HDD: ${login_hdd}
  -------------------------------
  MAC Address: ${user.mac_address}
  Login MAC Address: ${login_mac_address}
  -------------------------------
  IP: ${user.ip}
  Login IP: ${login_ip}`;
};
