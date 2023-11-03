import { IsOptional, IsString, Length } from "class-validator";

export class ChangeUserDto {
  @IsString()
  @IsOptional()
  @Length(3, 50)
  newUsername: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  newPassword: string;
}
