import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { scrypt as _scrypt, randomBytes } from "crypto";
import { promisify } from "util";

import { UsersService } from "../users/users.service";
import { User } from "../entities/user.entity";
import { getHashedPassword } from "src/utils";

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async signUp(): Promise<{ username: string; password: string }> {
    const password = randomBytes(6).toString("hex");
    const username = randomBytes(6).toString("hex");

    const hashedPasswod = await getHashedPassword(password);

    await this.usersService.create(username, hashedPasswod);

    return { username, password };
  }

  async signIn(user: { admin: boolean; username: string }) {
    const { accessToken, refreshToken } = this.signJwt(user);

    return {
      ...user,
      accessToken,
      refreshToken,
    };
  }

  validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException("Invalid token, please login again");
    }
  }

  async refreshToken(user: { admin: boolean; username: string }) {
    return this.signJwt(user);
  }

  signJwt(user: { admin: boolean; username: string }) {
    const payload = {
      username: user.username,
      admin: user.admin,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "7d" }),
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
