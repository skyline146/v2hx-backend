import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPlaying1702385470898 implements MigrationInterface {
  name = "AddIsPlaying1702385470898";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "is_playing" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_playing"`);
  }
}
