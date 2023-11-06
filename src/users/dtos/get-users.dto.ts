import { Exclude } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class GetUsersDto {
  @Exclude()
  password: string;

  @Exclude()
  admin: boolean;

  @Exclude()
  id: string;
}
