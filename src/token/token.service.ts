import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserRowDto } from "src/users/dtos";

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  validate(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      return null;
    }
  }

  refresh(user: UserRowDto) {
    return this.sign(user);
  }

  sign(user: UserRowDto) {
    const payload = {
      username: user.username,
      admin: user.admin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: "7d" }),
    };
  }
}
