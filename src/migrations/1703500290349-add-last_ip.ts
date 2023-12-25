import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastIp1703500290349 implements MigrationInterface {
  name = "AddLastIp1703500290349";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "last_ip" character varying NOT NULL DEFAULT ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_ip"`);
  }
}
