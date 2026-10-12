import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostRefactoring1712345678900 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_user" RENAME COLUMN "refreshToken" TO "refreshToken";`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_user" RENAME COLUMN "refreshToken" TO "refreshToken";`
    );
  }
}