import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameIsPlayingToOnline1702387969149 implements MigrationInterface {
  name = "RenameIsPlayingToOnline1702387969149";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "is_playing" TO "online"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "online" TO "is_playing"`);
  }
}
