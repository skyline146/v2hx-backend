import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { scrypt as _scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async create(username: string, password: string) {
    const user = this.userRepo.create({
      username,
      password,
    });

    this.userRepo.save(user);

    return { username, password };
  }

  async findOne(username: string) {
    return await this.userRepo.findOne({ where: { username } });
  }

  async remove(username: string) {
    const user = await this.userRepo.findOneBy({ username });

    if (!user) {
      return null;
    }

    return this.userRepo.remove(user);
  }

  async update(username: string, newData: Partial<User>) {
    const user = await this.userRepo.findOneBy({ username });

    if (!user) {
      return null;
    }

    // this.userRepo.update(login, newData);
    return this.userRepo.save(this.userRepo.merge(user, newData));
  }

  async updatePassword(username: string, newPassword: string) {
    const user = await this.userRepo.findOneBy({ username });

    const salt = randomBytes(8).toString("hex");
    const hash = (await scrypt(newPassword, salt, 32)) as Buffer;

    const result = salt + "." + hash.toString("hex");

    return this.userRepo.save(this.userRepo.merge(user, { password: result }));
  }
}
