import { HttpException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOperator, Repository } from "typeorm";
import { HTTPMethods } from "fastify";
import axios from "axios";

import { Playerlist } from "src/entities";

import { isXUID } from "src/lib";
import { XboxAuth, XboxGetUsersByXuids, XboxGetUsersByXuidsBody } from "./types";
import { PlayerRowDto } from "./dtos";

type Player = Omit<Playerlist, "id" | "added_by">;

type FindOptions = {
  xuid?: FindOperator<string>;
  gamertag?: FindOperator<string>;
};

@Injectable()
export class PlayerlistService {
  constructor(@InjectRepository(Playerlist) private playerlistRepo: Repository<Playerlist>) {}

  private xboxApi = axios.create({
    headers: {
      "X-XBL-Contract-Version": 2,
      "Content-Type": "application/json",
    },
    baseURL: "https://profile.xboxlive.com/",
  });

  private async xboxApiRequest<R, D = undefined>(
    url: string,
    method: HTTPMethods,
    authorization: XboxAuth,
    data?: D
  ) {
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

  async getPlayersByXUIDs(xuids: string[], authorization: XboxAuth): Promise<any> {
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

  async getMatchedPlayers(options: { xuid: string }[]) {
    return await this.playerlistRepo.find({ where: options });
  }

  async checkPlayer(xuidOrGamertag: string, authorization: XboxAuth) {
    const data = await this.xboxApiRequest<XboxGetUsersByXuids>(
      `users/${isXUID(xuidOrGamertag)}/profile/settings?settings=Gamertag`,
      "GET",
      authorization
    );
    const user = data.profileUsers[0];

    return {
      xuid: user.id,
      gamertag: user.settings[0].value,
    };
  }

  async create(player: Player, added_by: string) {
    const playerToAdd = this.playerlistRepo.create({
      ...player,
      added_by,
    });
    await this.playerlistRepo.save(playerToAdd);
  }

  async update(id: string, newData: PlayerRowDto) {
    const player = await this.playerlistRepo.findOneBy({ id });

    return await this.playerlistRepo.save(Object.assign(player, newData));
  }

  async remove(id: string) {
    const playerToRemove = await this.playerlistRepo.findOneBy({ id });

    if (!playerToRemove) {
      return null;
    }

    return await this.playerlistRepo.remove(playerToRemove);
  }

  async findAll(page: number, options: FindOptions | FindOptions[]) {
    return await this.playerlistRepo.findAndCount({
      take: 10,
      skip: (page - 1) * 10,
      where: options,
      order: {
        gamertag: "ASC",
      },
    });
  }

  async findOne(options: FindOptions) {
    return await this.playerlistRepo.findOne({ where: options });
  }
}
