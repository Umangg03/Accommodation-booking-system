import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAccommodationReferenceData1791700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const accommodationTypes = [
      ['Single room', 'Private room for one guest.'],
      ['Double room', 'Private room for two guests.'],
      ['Studio apartment', 'Self-contained open-plan apartment.'],
      ['Apartment', 'Private apartment with separate living space.'],
      ['Suite', 'Larger room with a separate living area.'],
      ['Villa', 'Private standalone home for guests.'],
    ];

    for (const [name, description] of accommodationTypes) {
      await queryRunner.query(
        `
          INSERT INTO "accommodation_type" ("name", "description")
          SELECT CAST($1 AS varchar), CAST($2 AS varchar)
          WHERE NOT EXISTS (
            SELECT 1
            FROM "accommodation_type"
            WHERE LOWER("name") = LOWER(CAST($1 AS varchar))
          )
        `,
        [name, description],
      );
    }

    const locations = [
      ['Adajan', 'Surat', 'India'],
      ['Vesu', 'Surat', 'India'],
      ['Piplod', 'Surat', 'India'],
      ['City Light', 'Surat', 'India'],
      ['Athwa', 'Surat', 'India'],
      ['Pal', 'Surat', 'India'],
      ['Katargam', 'Surat', 'India'],
      ['Varachha', 'Surat', 'India'],
    ];

    for (const [area, city, country] of locations) {
      await queryRunner.query(
        `
          INSERT INTO "location" ("area", "city", "country")
          SELECT
            CAST($1 AS varchar),
            CAST($2 AS varchar),
            CAST($3 AS varchar)
          WHERE NOT EXISTS (
            SELECT 1
            FROM "location"
            WHERE LOWER("area") = LOWER(CAST($1 AS varchar))
              AND LOWER("city") = LOWER(CAST($2 AS varchar))
              AND LOWER("country") = LOWER(CAST($3 AS varchar))
          )
        `,
        [area, city, country],
      );
    }
  }

  async down(): Promise<void> {
    
  }
}
