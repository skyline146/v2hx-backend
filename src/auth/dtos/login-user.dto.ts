import { IsString } from "class-validator";

export class LoginUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  hdd: string;

  @IsString()
  mac_address: string;
}
