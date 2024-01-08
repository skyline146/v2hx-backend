import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlayerlistTable1704655395206 implements MigrationInterface {
  name = "AddPlayerlistTable1704655395206";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."playerlist_type_enum" AS ENUM('0', '1', '2', '3')`
    );
    await queryRunner.query(
      `CREATE TABLE "playerlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "xuid" character varying NOT NULL, "gamertag" character varying NOT NULL DEFAULT '', "type" "public"."playerlist_type_enum" NOT NULL DEFAULT '0', "added_by" character varying NOT NULL DEFAULT '', CONSTRAINT "UQ_ad8ce1514b6376b791394501411" UNIQUE ("xuid"), CONSTRAINT "PK_bebfb64e289d6df1fa0cd507ebb" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "playerlist"`);
    await queryRunner.query(`DROP TYPE "public"."playerlist_type_enum"`);
  }
}
