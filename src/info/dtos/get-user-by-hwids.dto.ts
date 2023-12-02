import { IsString } from "class-validator";

export class GetUserByHwidsDto {
  @IsString()
  hwid1: string;

  @IsString()
  hwid2: string;
}
