import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQABugSchema1700000002000 implements MigrationInterface {
  name = 'CreateQABugSchema1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ticket_severity_enum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'BLOCKER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ticket_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ticket_priority_enum" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "gameTitle" character varying(150) NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "reproductionSteps" text,
        "severity" "ticket_severity_enum" NOT NULL DEFAULT 'MEDIUM',
        "status" "ticket_status_enum" NOT NULL DEFAULT 'OPEN',
        "priority" "ticket_priority_enum" NOT NULL DEFAULT 'NORMAL',
        "buildId" uuid,
        "reportedByUserId" uuid,
        "assignedToUserId" uuid,
        "environment" character varying(255),
        "logsUrl" text,
        "tags" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tickets_build" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tickets_reporter" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tickets_assignee" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_tenant_gameTitle" ON "tickets" ("tenantId", "gameTitle");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_tenant_status" ON "tickets" ("tenantId", "status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_tenant_severity" ON "tickets" ("tenantId", "severity");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_tenant_assigned" ON "tickets" ("tenantId", "assignedToUserId");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_tenant_assigned"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_tenant_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_tenant_gameTitle"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_severity_enum"`);
  }
}
