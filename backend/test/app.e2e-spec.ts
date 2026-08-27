import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import configuration from '../src/config/configuration';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantsModule } from '../src/modules/tenants/tenants.module';
import { UsersModule } from '../src/modules/users/users.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { BuildsModule } from '../src/modules/builds/builds.module';
import { QAModule } from '../src/modules/qa/qa.module';
import { AnalyticsModule } from '../src/modules/analytics/analytics.module';
import { LiveOpsModule } from '../src/modules/live-ops/live-ops.module';
import { BillingModule } from '../src/modules/billing/billing.module';

import { Tenant } from '../src/database/entities/tenant.entity';
import { User } from '../src/database/entities/user.entity';
import { Build } from '../src/database/entities/build.entity';
import { Ticket } from '../src/database/entities/ticket.entity';
import { AnalyticsEvent } from '../src/database/entities/analytics-event.entity';
import { LiveOpsEvent } from '../src/database/entities/live-ops-event.entity';
import { Subscription } from '../src/database/entities/subscription.entity';
import { PlanTier } from '../src/database/enums/plan-tier.enum';
import { UserRole } from '../src/database/enums/role.enum';
import { TargetPlatform } from '../src/database/enums/build.enum';
import { TicketSeverity, TicketStatus } from '../src/database/enums/ticket.enum';
import { LiveOpsEventType } from '../src/database/enums/live-ops.enum';
import { EventCategory } from '../src/database/enums/analytics.enum';

import { randomUUID } from 'crypto';

describe('StudioForge Enterprise Platform E2E Integration Suite (Phase 9)', () => {
  let app: INestApplication;

  const tenantsDb: Tenant[] = [];
  const usersDb: User[] = [];
  const buildsDb: Build[] = [];
  const ticketsDb: Ticket[] = [];
  const analyticsDb: AnalyticsEvent[] = [];
  const liveOpsDb: LiveOpsEvent[] = [];
  const subsDb: Subscription[] = [];

  beforeAll(async () => {
    const createMockRepo = (storage: any[]) => ({
      create: (dto: any) => ({
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      }),
      save: async (entity: any) => {
        if (Array.isArray(entity)) {
          storage.push(...entity);
          return entity;
        }
        const index = storage.findIndex((item) => item.id === entity.id);
        if (index >= 0) {
          storage[index] = { ...storage[index], ...entity };
          return storage[index];
        }
        storage.push(entity);
        return entity;
      },
      findOne: async (options: any) => {
        const where = options?.where || {};
        return (
          storage.find((item) => {
            return Object.keys(where).every((key) => item[key] === where[key]);
          }) || null
        );
      },
      find: async () => storage,
      count: async (options: any) => {
        const where = options?.where || {};
        return storage.filter((item) => {
          return Object.keys(where).every((key) => item[key] === where[key]);
        }).length;
      },
      remove: async (entity: any) => {
        const index = storage.findIndex((item) => item.id === entity.id);
        if (index >= 0) storage.splice(index, 1);
        return entity;
      },
      createQueryBuilder: (alias: string) => {
        let filtered = [...storage];
        const qb: any = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn((clause: string, params: any) => {
            if (params?.tenantId) {
              filtered = filtered.filter((i) => i.tenantId === params.tenantId);
            }
            if (params?.email) {
              filtered = filtered.filter((i) => i.email === params.email);
            }
            return qb;
          }),
          andWhere: jest.fn((clause: string, params: any) => {
            if (params?.tenantId) {
              filtered = filtered.filter((i) => i.tenantId === params.tenantId);
            }
            return qb;
          }),
          orderBy: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getCount: async () => filtered.length,
          getManyAndCount: async () => [filtered, filtered.length],
          getMany: async () => filtered,
          getOne: async () => filtered[0] || null,
          getRawOne: async () => ({ count: filtered.length.toString() }),
          getRawMany: async () => [],
        };
        return qb;
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        TenantsModule,
        UsersModule,
        AuthModule,
        BuildsModule,
        QAModule,
        AnalyticsModule,
        LiveOpsModule,
        BillingModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Tenant))
      .useValue(createMockRepo(tenantsDb))
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepo(usersDb))
      .overrideProvider(getRepositoryToken(Build))
      .useValue(createMockRepo(buildsDb))
      .overrideProvider(getRepositoryToken(Ticket))
      .useValue(createMockRepo(ticketsDb))
      .overrideProvider(getRepositoryToken(AnalyticsEvent))
      .useValue(createMockRepo(analyticsDb))
      .overrideProvider(getRepositoryToken(LiveOpsEvent))
      .useValue(createMockRepo(liveOpsDb))
      .overrideProvider(getRepositoryToken(Subscription))
      .useValue(createMockRepo(subsDb))
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let studio1Token = '';
  let studio1TenantId = '';
  let createdBuildId = '';
  let createdTicketId = '';

  describe('1. Authentication & Tenant Onboarding E2E Flow', () => {
    it('POST /api/v1/auth/register - should create new tenant and return JWT tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          organizationName: 'Mythic Realm Studios',
          email: 'admin@mythicrealm.com',
          password: 'SecureP@ssw0rd!2026',
          firstName: 'Jane',
          lastName: 'Doe',
        })
        .expect(201);

      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('admin@mythicrealm.com');
      expect(response.body.user.role).toBe(UserRole.OWNER);

      studio1Token = response.body.tokens.accessToken;
      studio1TenantId = response.body.user.tenantId;
    });

    it('GET /api/v1/auth/me - should return authenticated user profile with tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${studio1Token}`)
        .expect(200);

      expect(response.body.email).toBe('admin@mythicrealm.com');
      expect(response.body.tenant.name).toBe('Mythic Realm Studios');
    });
  });

  describe('2. Build Pipeline Ingestion E2E Flow', () => {
    it('POST /api/v1/builds - should create and register a build', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/builds')
        .set('Authorization', `Bearer ${studio1Token}`)
        .send({
          gameTitle: 'CyberArena: Legacy',
          version: 'v1.4.0-rc1',
          targetPlatform: TargetPlatform.WINDOWS,
          branch: 'release/1.4',
          commitHash: '9a8d4f3b',
          artifactUrl: 'https://cdn.studioforge.dev/builds/cyberarena-v1.4.0.zip',
          buildDurationSeconds: 240,
        })
        .expect(201);

      expect(response.body.version).toBe('v1.4.0-rc1');
      expect(response.body.tenantId).toBe(studio1TenantId);
      createdBuildId = response.body.id;
    });

    it('GET /api/v1/builds - should list builds for the studio', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/builds')
        .set('Authorization', `Bearer ${studio1Token}`)
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. QA / Bug Tracking E2E Flow', () => {
    it('POST /api/v1/qa/tickets - should create a bug ticket linked to build', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/qa/tickets')
        .set('Authorization', `Bearer ${studio1Token}`)
        .send({
          gameTitle: 'CyberArena: Legacy',
          title: 'Physics collider glitch in level 3',
          description: 'Player slips through elevator floor',
          reproductionSteps: '1. Crouch while elevator descends',
          severity: TicketSeverity.HIGH,
          buildId: createdBuildId,
        })
        .expect(201);

      expect(response.body.title).toBe('Physics collider glitch in level 3');
      expect(response.body.status).toBe(TicketStatus.OPEN);
      createdTicketId = response.body.id;
    });

    it('PATCH /api/v1/qa/tickets/:id/status - should transition status to RESOLVED', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/qa/tickets/${createdTicketId}/status`)
        .set('Authorization', `Bearer ${studio1Token}`)
        .send({ status: TicketStatus.RESOLVED })
        .expect(200);

      expect(response.body.status).toBe(TicketStatus.RESOLVED);
    });
  });

  describe('4. Telemetry Analytics Ingestion E2E Flow', () => {
    it('POST /api/v1/analytics/events/batch - should ingest batch of telemetry events', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/analytics/events/batch')
        .set('Authorization', `Bearer ${studio1Token}`)
        .send({
          events: [
            {
              gameTitle: 'CyberArena: Legacy',
              playerId: 'plyr_101',
              eventType: 'session_start',
              eventCategory: EventCategory.SYSTEM,
              clientTimestamp: new Date().toISOString(),
            },
            {
              gameTitle: 'CyberArena: Legacy',
              playerId: 'plyr_101',
              eventType: 'match_win',
              eventCategory: EventCategory.GAMEPLAY,
              clientTimestamp: new Date().toISOString(),
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it('GET /api/v1/analytics/summary - should return aggregated stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${studio1Token}`)
        .expect(200);

      expect(response.body.totalEvents).toBeDefined();
    });
  });

  describe('5. Live-Ops Console E2E Flow', () => {
    it('POST /api/v1/live-ops/events - should schedule double XP event', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/live-ops/events')
        .set('Authorization', `Bearer ${studio1Token}`)
        .send({
          gameTitle: 'CyberArena: Legacy',
          name: 'Double XP Weekend',
          type: LiveOpsEventType.DOUBLE_XP,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
          configPayload: { multiplier: 2.0 },
        })
        .expect(201);

      expect(response.body.name).toBe('Double XP Weekend');
    });
  });

  describe('6. Billing & Subscription E2E Flow', () => {
    it('GET /api/v1/billing/subscription - should return free plan with 5 seats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/subscription')
        .set('Authorization', `Bearer ${studio1Token}`)
        .expect(200);

      expect(response.body.planTier).toBe(PlanTier.FREE);
      expect(response.body.seats.maxSeats).toBe(5);
    });

    it('POST /api/v1/billing/upgrade - should upgrade plan to PRO with 25 seats', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/upgrade')
        .set('Authorization', `Bearer ${studio1Token}`)
        .send({ planTier: PlanTier.PRO })
        .expect(200);

      expect(response.body.planTier).toBe(PlanTier.PRO);
      expect(response.body.seats.maxSeats).toBe(25);
    });
  });
});
