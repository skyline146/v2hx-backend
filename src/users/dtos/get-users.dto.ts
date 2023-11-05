import { Transform } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class GetUsersDto {
  @IsString()
  public page: string;

  public username?: string;
}
