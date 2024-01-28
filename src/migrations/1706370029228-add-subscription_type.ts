import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionType1706370029228 implements MigrationInterface {
  name = "AddSubscriptionType1706370029228";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_type_enum" AS ENUM('', 'Week', 'Month', 'Lifetime')`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "subscription_type" "public"."user_subscription_type_enum" NOT NULL DEFAULT ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "subscription_type"`);
    await queryRunner.query(`DROP TYPE "public"."user_subscription_type_enum"`);
  }
}
