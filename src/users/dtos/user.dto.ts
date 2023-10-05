import { IsString, IsDate, IsNumber } from 'class-validator';

export class UserDto {
  @IsString()
  login: string;

  @IsString()
  password: string;

  @IsString()
  hwid: string;

  @IsString()
  last_hwid: string;

  @IsNumber()
  expire_date: number;
}
