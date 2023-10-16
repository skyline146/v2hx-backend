import {
  Body,
  Controller,
  Get,
  Post,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { UsersService } from './users.service';
import { UserDto } from './dtos/user.dto';
import { AuthService } from './auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('/login')
  async login(@Body() body: Partial<UserDto>) {
    console.log('Password from body:', body.password);
    const user = await this.authService.signIn(body.login, body.password);

    if (!user.hwid) {
      await this.usersService.update(user.login, { hwid: body.hwid });
    } else {
      if (user.hwid !== body.hwid) {
        throw new ForbiddenException('hwid does not match');
      }
    }

    const file = createReadStream(join(process.cwd(), 'SoT-DLC-v3.dll'));
    return new StreamableFile(file);
  }

  @Post('/create')
  async createUser() {
    const user = await this.authService.signUp();

    return user;
  }

  @Get('/test')
  time() {
    return new Date();
  }

  @Get('/date')
  async getDate(@Body() body: Partial<UserDto>) {
    const user = await this.usersService.findOne(body.login);

    return user;

    if (!user.expire_date) {
      throw new NotFoundException('user does not have subscription');
    }

    return user.expire_date < new Date() ? 'expired' : 'not expired';
  }
}
