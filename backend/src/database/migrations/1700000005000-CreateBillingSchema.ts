import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingSchema1700000005000 implements MigrationInterface {
  name = 'CreateBillingSchema1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscription_status_enum" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "planTier" "plan_tier_enum" NOT NULL DEFAULT 'FREE',
        "status" "subscription_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "seatsIncluded" integer NOT NULL DEFAULT 5,
        "monthlyPriceUsd" integer NOT NULL DEFAULT 0,
        "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
        "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
        "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,
        "paymentProviderCustomerId" character varying(100),
        "paymentProviderSubscriptionId" character varying(100),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscriptions_tenantId" UNIQUE ("tenantId"),
        CONSTRAINT "FK_subscriptions_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status_enum"`);
  }
}
