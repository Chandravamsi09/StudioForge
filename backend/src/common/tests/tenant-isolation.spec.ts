import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BuildsService } from '../../modules/builds/builds.service';
import { QAService } from '../../modules/qa/qa.service';
import { LiveOpsService } from '../../modules/live-ops/live-ops.service';
import { AnalyticsService } from '../../modules/analytics/analytics.service';
import { Build } from '../../database/entities/build.entity';
import { Ticket } from '../../database/entities/ticket.entity';
import { LiveOpsEvent } from '../../database/entities/live-ops-event.entity';
import { AnalyticsEvent } from '../../database/entities/analytics-event.entity';
import { BuildStatus, TargetPlatform } from '../../database/enums/build.enum';
import { TicketSeverity, TicketStatus, TicketPriority } from '../../database/enums/ticket.enum';
import { LiveOpsEventType, LiveOpsStatus } from '../../database/enums/live-ops.enum';

describe('Tenant Isolation Verification Suite (Phase 5)', () => {
  const tenantA = 'tenant-studio-alpha-1111';
  const tenantB = 'tenant-studio-bravo-2222';

  let buildsService: BuildsService;
  let qaService: QAService;
  let liveOpsService: LiveOpsService;
  let analyticsService: AnalyticsService;

  let buildRepo: any;
  let ticketRepo: any;
  let liveOpsRepo: any;
  let analyticsRepo: any;

  beforeEach(async () => {
    buildRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    ticketRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    liveOpsRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    analyticsRepo = {
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildsService,
        QAService,
        LiveOpsService,
        AnalyticsService,
        { provide: getRepositoryToken(Build), useValue: buildRepo },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        { provide: getRepositoryToken(LiveOpsEvent), useValue: liveOpsRepo },
        { provide: getRepositoryToken(AnalyticsEvent), useValue: analyticsRepo },
      ],
    }).compile();

    buildsService = module.get(BuildsService);
    qaService = module.get(QAService);
    liveOpsService = module.get(LiveOpsService);
    analyticsService = module.get(AnalyticsService);
  });

  describe('Builds Tenant Isolation', () => {
    it('should strictly deny Tenant A from accessing Tenant B build details (Row-Level Security)', async () => {
      // Simulate that build belongs to Tenant B
      buildRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.tenantId === tenantB && where.id === 'build-b-999') {
          return { id: 'build-b-999', tenantId: tenantB, gameTitle: 'Bravo Game' };
        }
        return null;
      });

      // Tenant A attempts to fetch build belonging to Tenant B
      await expect(buildsService.findById(tenantA, 'build-b-999')).rejects.toThrow(NotFoundException);
      expect(buildRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'build-b-999', tenantId: tenantA },
        relations: ['createdByUser'],
      });
    });

    it('should deny Tenant A from deleting Tenant B build', async () => {
      buildRepo.findOne.mockResolvedValue(null);

      await expect(buildsService.deleteBuild(tenantA, 'build-b-999')).rejects.toThrow(NotFoundException);
      expect(buildRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('QA Tickets Tenant Isolation', () => {
    it('should strictly deny Tenant A from mutating or viewing Tenant B bug tickets', async () => {
      ticketRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.tenantId === tenantB && where.id === 'ticket-b-888') {
          return { id: 'ticket-b-888', tenantId: tenantB, title: 'Confidential Bug' };
        }
        return null;
      });

      await expect(qaService.findById(tenantA, 'ticket-b-888')).rejects.toThrow(NotFoundException);
      await expect(
        qaService.changeStatus(tenantA, 'ticket-b-888', TicketStatus.CLOSED),
      ).rejects.toThrow(NotFoundException);
      expect(ticketRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('Live-Ops Tenant Isolation', () => {
    it('should strictly deny Tenant A from reading or modifying Tenant B live-ops events', async () => {
      liveOpsRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.tenantId === tenantB && where.id === 'event-b-777') {
          return { id: 'event-b-777', tenantId: tenantB, name: 'Bravo Double XP' };
        }
        return null;
      });

      await expect(liveOpsService.findById(tenantA, 'event-b-777')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Analytics Telemetry Isolation', () => {
    it('should scope analytics query builder strictly to caller tenantId', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      analyticsRepo.createQueryBuilder.mockReturnValue(qb);

      await analyticsService.findAll(tenantA, { page: 1, limit: 50 });

      expect(qb.where).toHaveBeenCalledWith('event.tenantId = :tenantId', { tenantId: tenantA });
    });
  });
});
