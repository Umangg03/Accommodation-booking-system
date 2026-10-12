import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerMultipleCompanies1792000000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_companies" (
        "customerId" integer NOT NULL,
        "companyId" integer NOT NULL,
        CONSTRAINT "PK_customer_companies" PRIMARY KEY ("customerId", "companyId"),
        CONSTRAINT "FK_customer_companies_customer"
          FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_customer_companies_company"
          FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "customer_companies" ("customerId", "companyId")
      SELECT customer."id", customer."companyId"
      FROM "customers" AS customer
      INNER JOIN "company" AS company
        ON company."id" = customer."companyId"
      WHERE customer."companyId" IS NOT NULL
      ON CONFLICT ("customerId", "companyId") DO NOTHING
    `);
    await queryRunner.query(`
      ALTER TABLE "booking"
      ADD COLUMN IF NOT EXISTS "companyId" integer
    `);
    await queryRunner.query(`
      UPDATE "booking" AS booking
      SET "companyId" = customer."companyId"
      FROM "customers" AS customer
      WHERE booking."customerId" = customer."id"
        AND booking."companyId" IS NULL
        AND customer."companyId" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "customers" AS customer
      SET "companyId" = assignment."companyId"
      FROM (
        SELECT "customerId", MIN("companyId") AS "companyId"
        FROM "customer_companies"
        GROUP BY "customerId"
      ) AS assignment
      WHERE customer."id" = assignment."customerId"
        AND customer."companyId" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "booking"
      DROP COLUMN IF EXISTS "companyId"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_companies"`);
  }
}
