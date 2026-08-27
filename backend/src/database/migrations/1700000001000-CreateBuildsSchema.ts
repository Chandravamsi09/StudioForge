import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBuildsSchema1700000001000 implements MigrationInterface {
  name = 'CreateBuildsSchema1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "target_platform_enum" AS ENUM (
          'WINDOWS', 'MAC', 'LINUX', 'ANDROID', 'IOS', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'WEBGL'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "build_status_enum" AS ENUM (
          'QUEUED', 'BUILDING', 'SUCCESS', 'FAILED', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "builds" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "gameTitle" character varying(150) NOT NULL,
        "version" character varying(50) NOT NULL,
        "targetPlatform" "target_platform_enum" NOT NULL DEFAULT 'WINDOWS',
        "status" "build_status_enum" NOT NULL DEFAULT 'QUEUED',
        "commitHash" character varying(64),
        "branch" character varying(100) NOT NULL DEFAULT 'main',
        "artifactUrl" text,
        "artifactSizeBytes" bigint,
        "buildDurationSeconds" integer,
        "changelog" text,
        "metadata" jsonb,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_builds_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_builds_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_builds_user" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_builds_tenant_gameTitle" ON "builds" ("tenantId", "gameTitle");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_builds_tenant_status" ON "builds" ("tenantId", "status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_builds_tenant_platform" ON "builds" ("tenantId", "targetPlatform");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_builds_tenant_platform"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_builds_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_builds_tenant_gameTitle"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "builds"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "build_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "target_platform_enum"`);
  }
}
