import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReasonColumn1704658715621 implements MigrationInterface {
  name = "AddReasonColumn1704658715621";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playerlist" ADD "reason" character varying NOT NULL DEFAULT ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "playerlist" DROP COLUMN "reason"`);
  }
}
