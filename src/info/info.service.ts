import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Info } from "../entities/info.entity";
import { Repository } from "typeorm";
import { InfoDto } from "./dtos/info.dto";

@Injectable()
export class InfoService {
  constructor(@InjectRepository(Info) private infoRepo: Repository<Info>) {}

  async get() {
    return await this.infoRepo.findOne({ where: { cheat_version: undefined } });
  }

  async update(data: Partial<InfoDto>) {
    const info = await this.infoRepo.findOne({ where: { cheat_version: undefined } });

    return await this.infoRepo.save(this.infoRepo.merge(info, data));
  }
}
