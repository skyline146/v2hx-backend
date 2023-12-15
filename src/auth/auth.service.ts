import { BadRequestException, Injectable } from "@nestjs/common";
import { scrypt as _scrypt, randomBytes } from "crypto";
import { promisify } from "util";

import { UsersService } from "../users/users.service";
import { User } from "../entities/user.entity";
import { getHashedPassword } from "src/lib";
import { UserRowDto } from "src/users/dtos";
import { TokenService } from "src/token/token.service";

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService
  ) {}

  async signUp() {
    const password = randomBytes(6).toString("hex");
    const username = randomBytes(6).toString("hex");

    const hashedPasswod = await getHashedPassword(password);

    await this.usersService.create(username, hashedPasswod);

    return { username, password };
  }

  signIn(user: UserRowDto) {
    const { access_token, refresh_token } = this.tokenService.sign(user);

    return {
      ...user,
      access_token,
      refresh_token,
    };
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.usersService.findOne({ username });

    if (!user) {
      throw new BadRequestException("Incorrect username or password");
    }

    const [salt, storedHash] = user.password.split(".");

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (hash.toString("hex") !== storedHash) {
      throw new BadRequestException("Incorrect username or password");
    }

    return user;
  }
}
