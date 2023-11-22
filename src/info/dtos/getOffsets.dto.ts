import { IsString } from "class-validator";

export class GetOffsetsDto {
  @IsString()
  hwid1: string;

  @IsString()
  hwid2: string;
}
