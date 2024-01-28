import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserInviteCode1706301845484 implements MigrationInterface {
  name = "AddUserInviteCode1706301845484";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "invitation_code" character varying NOT NULL DEFAULT ''`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "is_code_activated" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_code_activated"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "invitation_code"`);
  }
}
