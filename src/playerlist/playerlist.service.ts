import { HttpException, Injectable } from "@nestjs/common";
import { HTTPMethods } from "fastify";
import axios from "axios";

interface XboxUser {
  id: string;
  settings: { id: string; value: string }[];
}

interface XboxGetUsersByXuidsBody {
  userIds: string[];
  settings: string[];
}

interface XboxGetUsersByXuids {
  profileUsers: XboxUser[];
}

interface XboxAuth {
  user_hash: string;
  xsts_token: string;
}
// "Mozilla/5.0 (XboxReplay; XboxLiveAPI/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"

@Injectable()
export class PlayerlistService {
  private xboxApi = axios.create({
    headers: {
      // Accept: "application/json",
      // "Accept-Encoding": "gzip",
      // "Accept-Language": "en-US",
      // "User-Agent": "XboxServicesAPI/2020.02.0.0 cpp",
      "X-XBL-Contract-Version": 2,
      "Content-Type": "application/json",
    },
    baseURL: "https://profile.xboxlive.com/",
  });

  async xboxApiRequest<R, D>(url: string, method: HTTPMethods, authorization: XboxAuth, data?: D) {
    try {
      const response = await this.xboxApi.request<R>({
        url,
        method,
        data,
        headers: {
          Authorization: `XBL3.0 x=${authorization.user_hash};${authorization.xsts_token}`,
        },
      });

      return response.data;
    } catch (err) {
      throw new HttpException(
        err.response.data.description ?? "Request failed",
        err.response.status
      );
    }
  }

  async getPlayersByXUIDs(xuids: string[], authorization: XboxAuth): Promise<string[]> {
    const data = await this.xboxApiRequest<XboxGetUsersByXuids, XboxGetUsersByXuidsBody>(
      "users/batch/profile/settings",
      "POST",
      authorization,
      {
        userIds: xuids,
        settings: ["Gamertag"],
      }
    );

    return data.profileUsers.map((user) => user.settings[0].value);
  }
}
