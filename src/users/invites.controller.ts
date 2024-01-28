import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  NotFoundException,
  Inject,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { UseZodGuard, ZodSerializerDto } from "nestjs-zod";

import { UsersService } from "./users.service";
import { ActiveUserGuard } from "src/guards";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { checkSubscription, addDaysToSubscription } from "src/lib";

import { UserDto, InvitationCodeDto } from "./dtos";

@UseGuards(JwtAuthGuard)
@Controller("invites")
export class InvitesController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @UseGuards(ActiveUserGuard)
  @UseZodGuard("body", InvitationCodeDto)
  @Post("")
  async createInvitationCode(@Request() req: FastifyRequest, @Body() body: InvitationCodeDto) {
    const existedCode = await this.usersService.findOne({ invitation_code: body.code });

    if (existedCode) {
      throw new BadRequestException("Code already existed.");
    }

    this.usersService.update(req.user.username, { invitation_code: body.code });

    this.logger.info(`User ${req.user.username} created invitation code ${body.code}.`);

    return "Code created!";
  }

  @UseGuards(ActiveUserGuard)
  @UseZodGuard("body", InvitationCodeDto)
  @ZodSerializerDto(UserDto)
  @Post("/accept")
  async activateCode(@Request() req: FastifyRequest, @Body() body: InvitationCodeDto) {
    let userAccepter = req.user;

    if (userAccepter.is_code_activated) {
      throw new ForbiddenException("You have activated code already.");
    }

    if (userAccepter.invitation_code === body.code) {
      throw new ForbiddenException("You can't enter your own code.");
    }

    const userInviter = await this.usersService.findOne({ invitation_code: body.code });

    if (!userInviter) {
      throw new NotFoundException("Invitation code not found.");
    }

    if (!checkSubscription(userInviter.expire_date)) {
      throw new ForbiddenException("Inviter does not have active subscription.");
    }

    //check if inviter has no lifetime sub
    if (userInviter.subscription_type !== "Lifetime") {
      switch (userAccepter.subscription_type) {
        case "Week": {
          //add 1 day to userInviter
          this.usersService.update(userInviter.username, {
            expire_date: addDaysToSubscription(userInviter.expire_date, 1),
          });

          break;
        }
        case "Month": {
          //add 3 days to userInviter
          this.usersService.update(userInviter.username, {
            expire_date: addDaysToSubscription(userInviter.expire_date, 3),
          });

          break;
        }
        case "Lifetime": {
          //add 7 days to userInviter
          this.usersService.update(userInviter.username, {
            expire_date: addDaysToSubscription(userInviter.expire_date, 7),
          });

          break;
        }
      }
    }

    //increment code_activations for inviter
    this.usersService.update(userInviter.username, {
      code_activations: userInviter.code_activations + 1,
    });

    //set is_code_activated to true for accepter, add 1 day to accepter
    userAccepter = await this.usersService.update(userAccepter.username, {
      is_code_activated: true,
      expire_date: addDaysToSubscription(userAccepter.expire_date, 1),
    });

    this.logger.info(
      `User ${userAccepter.username}(${userAccepter.subscription_type}) activated code ${body.code}. Inviter ${userInviter.username}.`
    );

    return userAccepter;
  }
}
