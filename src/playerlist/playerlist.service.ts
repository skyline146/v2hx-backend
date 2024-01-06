import { Injectable } from "@nestjs/common";
import axios from "axios";

interface XboxUser {
  id: string;
  settings: { id: string; value: string }[];
}

interface XboxGetUsersByXuids {
  profileUsers: XboxUser[];
}
interface XboxAuth {
  userHash: string;
  XSTSToken: string;
}

@Injectable()
export class PlayerlistService {
  private headers = {
    // eslint-disable-next-line prettier/prettier
    "Accept": "application/json",
    "Accept-encoding": "gzip",
    "Accept-Language": "en-US",
    "User-Agent":
      "Mozilla/5.0 (XboxReplay; XboxLiveAPI/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
    "x-xbl-contract-version": 2,
    "content-type": "application/json",
  };

  private xboxApi = axios.create({
    headers: this.headers,
    baseURL: "https://profile.xboxlive.com/",
  });

  async getPlayersByXUIDs(xuids: string[], authorization: XboxAuth): Promise<string[]> {
    const response = await this.xboxApi.post<XboxGetUsersByXuids>(
      "users/batch/profile/settings",
      {
        userIds: xuids,
        settings: ["Gamertag"],
      },
      {
        headers: { Authorization: `XBL3.0 x=${authorization.userHash};${authorization.XSTSToken}` },
      }
    );

    return response.data.profileUsers.map((user) => user.settings[0].value);
  }
}
