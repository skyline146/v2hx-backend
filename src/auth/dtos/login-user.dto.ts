import { IsString } from "class-validator";

export class LoginUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  hwid1: string;

  @IsString()
  hwid2: string;
}
