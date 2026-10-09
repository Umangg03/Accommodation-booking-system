import bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAdminAndCompany1791430000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be set before running the initial seed migration.',
      );
    }

    await queryRunner.query(`
      INSERT INTO "role" ("role", "description")
      SELECT 'Admin', 'System administrator'
      WHERE NOT EXISTS (SELECT 1 FROM "role" WHERE LOWER("role") = 'admin')
    `);
    await queryRunner.query(`
      INSERT INTO "role" ("role", "description")
      SELECT 'User', 'Standard user'
      WHERE NOT EXISTS (SELECT 1 FROM "role" WHERE LOWER("role") = 'user')
    `);

    const companies = (await queryRunner.query(
      `
        INSERT INTO "company" ("name", "address", "industry")
        SELECT $1::varchar, 'Not configured', 'Not configured'
        WHERE NOT EXISTS (SELECT 1 FROM "company" WHERE "name" = $1)
        RETURNING "id"
      `,
      [process.env.COMPANY_NAME?.trim() || 'Default Company'],
    )) as Array<{ id: number }>;
    const companyId =
      companies[0]?.id ??
      (
        (await queryRunner.query(
          'SELECT "id" FROM "company" WHERE "name" = $1 ORDER BY "id" ASC LIMIT 1',
          [process.env.COMPANY_NAME?.trim() || 'Default Company'],
        )) as Array<{ id: number }>
      )[0]?.id;

    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const admins = (await queryRunner.query(
      `
        INSERT INTO "users" ("name", "email", "password", "roleId")
        SELECT $1, $2::varchar, $3, "id"
        FROM "role"
        WHERE LOWER("role") = 'admin'
          AND NOT EXISTS (SELECT 1 FROM "users" WHERE LOWER("email") = LOWER($2))
        ORDER BY "id" ASC
        LIMIT 1
        RETURNING "id"
      `,
      [
        process.env.ADMIN_NAME?.trim() || 'Administrator',
        adminEmail,
        adminPasswordHash,
      ],
    )) as Array<{ id: number }>;
    const adminId =
      admins[0]?.id ??  
      (
        (await queryRunner.query(
          `
            SELECT "users"."id", "role"."role"
            FROM "users"
            LEFT JOIN "role" ON "role"."id" = "users"."roleId"
            WHERE LOWER("users"."email") = LOWER($1)
            LIMIT 1
          `,
          [adminEmail],
        )) as Array<{ id: number }>
      )[0]?.id;

    if (!companyId || !adminId) {
      throw new Error('Unable to create or locate the initial admin and company.');
    }

    const [admin] = (await queryRunner.query(
      `
        SELECT "role"."role"
        FROM "users"
        LEFT JOIN "role" ON "role"."id" = "users"."roleId"
        WHERE "users"."id" = $1
      `,
      [adminId],
    )) as Array<{ role: string | null }>;
    if (admin?.role?.toLowerCase() !== 'admin') {
      throw new Error(
        `The configured initial admin email "${adminEmail}" already belongs to a non-admin user.`,
      );
    }

    await queryRunner.query(
      `
        INSERT INTO "company_users_users" ("companyId", "usersId")
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [companyId, adminId],
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'The initial admin/company seed migration is intentionally irreversible.',
    );
  }
}
