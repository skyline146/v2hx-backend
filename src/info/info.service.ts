import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Info } from "../entities/info.entity";
import { InfoDto } from "./dtos/info.dto";

@Injectable()
export class InfoService {
  constructor(@InjectRepository(Info) private infoRepo: Repository<Info>) {}

  async get() {
    return await this.infoRepo.findOne({
      where: { id: 1 },
    });
  }

  async update(data: InfoDto): Promise<Info> {
    const info = await this.get();

    return await this.infoRepo.save(Object.assign(info, data));
  }
}
