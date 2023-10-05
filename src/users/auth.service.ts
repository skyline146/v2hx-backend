import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signUp() {
    // const users = await this.usersService.findOne(email);

    // if (users.length) {
    //   throw new BadRequestException('email in use');
    // }

    const password = randomBytes(6).toString('hex');
    const login = randomBytes(6).toString('hex');

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    await this.usersService.create(login, result);

    return { login, password };
  }

  async signIn(login: string, password: string) {
    const user = await this.usersService.findOne(login);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (hash.toString('hex') !== storedHash) {
      throw new BadRequestException('invalid login');
    }

    return user;
  }
}
