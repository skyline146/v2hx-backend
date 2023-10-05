import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  create(login: string, password: string) {
    const user = this.userRepo.create({
      login,
      password,
      hwid: '',
      last_hwid: '',
      expire_date: 0,
    });

    return this.userRepo.save(user);
  }

  findOne(login: string) {
    return this.userRepo.findOneBy({ login });
  }

  async remove(login: string) {
    const user = await this.userRepo.findOneBy({ login });

    if (!user) {
      return null;
    }

    return this.userRepo.remove(user);
  }

  async update(login: string, newData: Partial<User>) {
    // await this.repo
    //   .createQueryBuilder()
    //   .update()
    //   .set({ email, password })
    //   .where('id = :id', { id })
    //   .execute();

    console.log(newData);

    const user = await this.userRepo.findOneBy({ login });

    if (!user) {
      return null;
    }

    return this.userRepo.save(this.userRepo.merge(user, newData));
  }
}
