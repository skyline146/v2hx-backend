import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrivateAccessField1708601096041 implements MigrationInterface {
  name = "AddPrivateAccessField1708601096041";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "private_access" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "private_access"`);
  }
}
