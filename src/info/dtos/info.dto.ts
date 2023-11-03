import { IsString } from "class-validator";

export class InfoDto {
  @IsString()
  status: string;

  @IsString()
  cheat_version: string;

  @IsString()
  loader_version: string;
}
