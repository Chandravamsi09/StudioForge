import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnalyticsEventsSchema1700000003000 implements MigrationInterface {
  name = 'CreateAnalyticsEventsSchema1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "event_category_enum" AS ENUM ('GAMEPLAY', 'ECONOMY', 'PERFORMANCE', 'PROGRESSION', 'SYSTEM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "gameTitle" character varying(150) NOT NULL,
        "playerId" character varying(100) NOT NULL,
        "sessionId" character varying(100),
        "eventType" character varying(100) NOT NULL,
        "eventCategory" "event_category_enum" NOT NULL DEFAULT 'GAMEPLAY',
        "platform" character varying(50),
        "gameVersion" character varying(50),
        "properties" jsonb NOT NULL DEFAULT '{}',
        "clientTimestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ingestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_analytics_events_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_analytics_events_tenant_gameTitle" ON "analytics_events" ("tenantId", "gameTitle");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_analytics_events_tenant_eventType" ON "analytics_events" ("tenantId", "eventType");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_analytics_events_tenant_category" ON "analytics_events" ("tenantId", "eventCategory");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_analytics_events_tenant_playerId" ON "analytics_events" ("tenantId", "playerId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_analytics_events_tenant_timestamp" ON "analytics_events" ("tenantId", "clientTimestamp");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analytics_events_tenant_timestamp"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analytics_events_tenant_playerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analytics_events_tenant_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analytics_events_tenant_eventType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analytics_events_tenant_gameTitle"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_category_enum"`);
  }
}
