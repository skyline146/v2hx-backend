import { Injectable } from "@nestjs/common";
import { Repository, Like, FindOperator } from "typeorm";
import { promisify } from "util";
import { scrypt as _scrypt, randomBytes } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";

import { User } from "../entities/user.entity";
import { UserDto } from "./dtos/user.dto";

const scrypt = promisify(_scrypt);

type FindOneOptions = {
  username?: string;
  hdd?: string;
  mac_address?: string;
};

type FindAllOptions = {
  expire_date?: FindOperator<string>;
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

    return { username, password };
  }

  async findOne(options: FindOneOptions) {
    return await this.userRepo.findOne({ where: options });
  }

  async findAll(options?: FindAllOptions) {
    return await this.userRepo.find({ where: options });
  }

  async findLikePagination(page: number, username?: string | undefined) {
    return await this.userRepo.findAndCount({
      take: 10,
      skip: (page - 1) * 10,
      where: { username: username ? Like(`%${username}%`) : undefined },
    });
  }

  async remove(username: string) {
    const user = await this.userRepo.findOneBy({ username });

    if (!user) {
      return null;
    }

    return await this.userRepo.remove(user);
  }

  async updateMany(data: User[]) {
    await this.userRepo.save(data);
  }

  async update(username: string, newData: Partial<UserDto>) {
    const user = await this.userRepo.findOneBy({ username });

    if (!user) {
      return null;
    }

    return await this.userRepo.save(this.userRepo.merge(user, newData));
  }

  async updatePassword(username: string, newPassword: string) {
    const user = await this.userRepo.findOneBy({ username });

    const salt = randomBytes(8).toString("hex");
    const hash = (await scrypt(newPassword, salt, 32)) as Buffer;

    const result = salt + "." + hash.toString("hex");

    return this.userRepo.save(this.userRepo.merge(user, { password: result }));
  }
}
