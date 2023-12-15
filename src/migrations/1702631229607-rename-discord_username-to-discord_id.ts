import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameDiscordUsernameToDiscordId1702631229607 implements MigrationInterface {
  name = "RenameDiscordUsernameToDiscordId1702631229607";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "discord_username" TO "discord_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "discord_id" TO "discord_username"`);
  }
}
