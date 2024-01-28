import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeActivations1706386486063 implements MigrationInterface {
  name = "AddCodeActivations1706386486063";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "code_activations" integer NOT NULL DEFAULT '0'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "code_activations"`);
  }
}
