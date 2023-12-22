import { Injectable } from "@nestjs/common";
import { Repository, FindOperator } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { UserRowDto } from "./dtos";
import { User } from "../entities/user.entity";

type FindAllOptions = {
  expire_date?: FindOperator<string>;
  username?: FindOperator<string>;
  discord_id?: FindOperator<string>;
  online?: boolean;
};

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async create(username: string, password: string) {
    const user = this.userRepo.create({
      username,
      password,
    });

    await this.userRepo.save(user);
  }

  async findOne(options: Partial<UserRowDto>) {
    return await this.userRepo.findOne({ where: options });
  }

  async findAll(options?: FindAllOptions) {
    return await this.userRepo.find({ where: options });
  }

  async findAllCount(options?: FindAllOptions) {
    return await this.userRepo.findAndCount({ where: options });
  }

  async findLikePagination(page: number, options: FindAllOptions | FindAllOptions[]) {
    return await this.userRepo.findAndCount({
      take: 10,
      skip: (page - 1) * 10,
      where: options,
      order: {
        username: "ASC",
      },
    });
  }

  async remove(username: string) {
    const user = await this.userRepo.findOneBy({ username });

    if (!user || user.admin) {
      return null;
    }

    return await this.userRepo.remove(user);
  }

  async updateMany(data: User[]) {
    return await this.userRepo.save(data);
  }

  async update(username: string, newData: Partial<User>): Promise<User> {
    const user = await this.userRepo.findOneBy({ username });

    if (!user) {
      return null;
    }

    return await this.userRepo.save(Object.assign(user, newData));
  }
}
