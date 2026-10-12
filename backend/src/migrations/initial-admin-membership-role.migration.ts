import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAdminMembershipRole1791900000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL must be set to repair the initial admin role.');
    }
    const companyName =
      process.env.COMPANY_NAME?.trim() || 'Default Company';

    await queryRunner.query(
      `
        INSERT INTO "company_users_users" ("companyId", "usersId", "role")
        SELECT company."id", account."id", 'ADMIN'
        FROM "users" AS account
        INNER JOIN "role" AS account_role
          ON account_role."id" = account."roleId"
        INNER JOIN "company" AS company
          ON company."id" = (
            SELECT selected_company."id"
            FROM "company" AS selected_company
            WHERE selected_company."name" = $2
            ORDER BY selected_company."id" ASC
            LIMIT 1
          )
        WHERE LOWER(account."email") = LOWER($1)
          AND LOWER(account_role."role") = 'admin'
        ON CONFLICT ("usersId", "companyId")
        DO UPDATE SET "role" = 'ADMIN'
      `,
      [adminEmail, companyName],
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'The initial admin membership role repair is intentionally irreversible.',
    );
  }
}
