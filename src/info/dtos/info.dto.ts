import { IsString } from "class-validator";

export class InfoDto {
  @IsString()
  status: string;

  @IsString()
  version: string;
}
