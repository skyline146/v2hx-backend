import { IsString, IsDate, IsNumber, IsBoolean } from "class-validator";
import { Exclude } from "class-transformer";

export class UserDto {
  @IsString()
  username: string;

  @IsString()
  @Exclude()
  password: string;

  @IsString()
  @Exclude()
  hdd: string;

  @IsString()
  @Exclude()
  last_hdd: string;

  @IsString()
  @Exclude()
  mac_adress: string;

  @IsString()
  @Exclude()
  last_mac_adress: string;

  @IsNumber()
  @Exclude()
  warn: number;

  @IsBoolean()
  @Exclude()
  ban: boolean;

  expire_date: Date;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
