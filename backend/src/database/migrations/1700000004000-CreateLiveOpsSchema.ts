import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLiveOpsSchema1700000004000 implements MigrationInterface {
  name = 'CreateLiveOpsSchema1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "live_ops_type_enum" AS ENUM (
          'DOUBLE_XP', 'HOLIDAY_EVENT', 'TOURNAMENT', 'FLASH_SALE', 'FEATURE_FLAG', 'ECONOMY_OVERRIDE', 'CUSTOM'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "live_ops_status_enum" AS ENUM (
          'DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "live_ops_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "gameTitle" character varying(150) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "type" "live_ops_type_enum" NOT NULL DEFAULT 'CUSTOM',
        "status" "live_ops_status_enum" NOT NULL DEFAULT 'DRAFT',
        "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "configPayload" jsonb NOT NULL DEFAULT '{}',
        "targetAudience" character varying(100),
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_live_ops_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_live_ops_events_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_live_ops_events_user" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_live_ops_tenant_gameTitle" ON "live_ops_events" ("tenantId", "gameTitle");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_live_ops_tenant_status" ON "live_ops_events" ("tenantId", "status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_live_ops_tenant_type" ON "live_ops_events" ("tenantId", "type");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_ops_tenant_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_ops_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_ops_tenant_gameTitle"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "live_ops_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "live_ops_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "live_ops_type_enum"`);
  }
}
