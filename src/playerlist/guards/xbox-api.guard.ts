import { CanActivate, ExecutionContext, Injectable, Inject } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { authenticate } from "@xboxreplay/xboxlive-auth";

interface XboxUserData {
  user_hash: string;
  xsts_token: string;
  expires_on: string;
}

@Injectable()
export class XboxApiGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    let user_hash = await this.cacheManager.get<string>("user_hash");
    let xsts_token = await this.cacheManager.get<string>("xsts_token");
    let expires_on = await this.cacheManager.get<string>("expires_on");

    if (!expires_on) {
      try {
        const userData = (await authenticate(
          process.env.XBOX_EMAIL,
          process.env.XBOX_PASSWORD
        )) as XboxUserData;

        user_hash = userData.user_hash;
        xsts_token = userData.xsts_token;
        expires_on = userData.expires_on;

        await this.cacheManager.set("user_hash", user_hash, 0);
        await this.cacheManager.set("xsts_token", xsts_token, 0);
        await this.cacheManager.set(
          "expires_on",
          expires_on,
          new Date(expires_on).getTime() - Date.now()
        );
      } catch (err) {
        console.log(err);
      }
    }

    request.xbox_user = { user_hash, xsts_token };

    return true;
  }
}
