import { IsString } from "class-validator";

export class GetOffsetsDto {
  @IsString()
  hdd: string;

  @IsString()
  mac_address: string;
}
