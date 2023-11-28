import { IsString, IsNumber, IsBoolean } from "class-validator";
import { Exclude } from "class-transformer";

export class UserDto {
  @IsString()
  username: string;

  @IsString()
  discord_username: string;

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
  mac_address: string;

  @IsString()
  @Exclude()
  last_mac_address: string;

  @IsNumber()
  @Exclude()
  warn: number;

  @IsBoolean()
  @Exclude()
  ban: boolean;

  expire_date: string;

  last_entry_date: string;

  @IsString()
  @Exclude()
  accessToken: string;

  @IsString()
  @Exclude()
  refreshToken: string;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
