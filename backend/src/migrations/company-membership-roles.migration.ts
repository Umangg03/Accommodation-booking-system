import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyMembershipRoles1791800000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_users_users"
      ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'USER'
    `);
    await queryRunner.query(`
      UPDATE "company_users_users" AS membership
      SET "role" = CASE
        WHEN LOWER(role."role") = 'admin' THEN 'ADMIN'
        ELSE 'USER'
      END
      FROM "users" AS account
      LEFT JOIN "role" AS role ON role."id" = account."roleId"
      WHERE membership."usersId" = account."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers" DROP COLUMN IF EXISTS "deletedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "company_users_users" DROP COLUMN IF EXISTS "role"
    `);
  }
}
