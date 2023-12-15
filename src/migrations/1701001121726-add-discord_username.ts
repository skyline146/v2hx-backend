import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiscordUsername1701001121726 implements MigrationInterface {
  name = "AddDiscordUsername1701001121726";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "discord_username" character varying NOT NULL DEFAULT ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "discord_username"`);
  }
}
