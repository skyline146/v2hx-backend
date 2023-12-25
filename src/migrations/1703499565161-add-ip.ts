import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIp1703499565161 implements MigrationInterface {
  name = "AddIp1703499565161";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "ip" character varying NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "ip"`);
  }
}
