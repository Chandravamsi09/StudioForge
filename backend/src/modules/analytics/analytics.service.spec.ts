import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from '../../database/entities/analytics-event.entity';
import { EventCategory } from '../../database/enums/analytics.enum';

describe('AnalyticsService (Phase 4)', () => {
  let service: AnalyticsService;
  let repository: jest.Mocked<Repository<AnalyticsEvent>>;

  const mockEvent: AnalyticsEvent = {
    id: 'evt-123',
    tenantId: 'tenant-123',
    tenant: null,
    gameTitle: 'CyberArena: Legacy',
    playerId: 'plyr_9824a71b',
    sessionId: 'sess_11223344',
    eventType: 'level_completed',
    eventCategory: EventCategory.PROGRESSION,
    platform: 'WINDOWS',
    gameVersion: 'v1.4.0',
    properties: { level: 3, score: 9400 },
    clientTimestamp: new Date('2026-08-27T10:00:00.000Z'),
    ingestedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'evt-123', ingestedAt: new Date(), ...dto })),
      save: jest.fn().mockImplementation((event) => Promise.resolve(event)),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get(getRepositoryToken(AnalyticsEvent));
  });

  describe('ingestSingle', () => {
    it('should successfully ingest a single telemetry event', async () => {
      const dto = {
        gameTitle: 'CyberArena: Legacy',
        playerId: 'plyr_9824a71b',
        eventType: 'level_completed',
        eventCategory: EventCategory.PROGRESSION,
        clientTimestamp: '2026-08-27T10:00:00.000Z',
      };

      const result = await service.ingestSingle('tenant-123', dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          gameTitle: 'CyberArena: Legacy',
          playerId: 'plyr_9824a71b',
          eventType: 'level_completed',
          eventCategory: EventCategory.PROGRESSION,
        }),
      );
      expect(result.success).toBe(true);
      expect(result.eventId).toBe('evt-123');
    });
  });

  describe('ingestBatch', () => {
    it('should successfully ingest an array of telemetry events', async () => {
      const batchDto = {
        events: [
          {
            gameTitle: 'CyberArena: Legacy',
            playerId: 'plyr_1',
            eventType: 'session_start',
            clientTimestamp: '2026-08-27T10:00:00.000Z',
          },
          {
            gameTitle: 'CyberArena: Legacy',
            playerId: 'plyr_2',
            eventType: 'item_purchase',
            eventCategory: EventCategory.ECONOMY,
            clientTimestamp: '2026-08-27T10:01:00.000Z',
          },
        ],
      };

      const result = await service.ingestBatch('tenant-123', batchDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should reject batch ingestion if events array is empty', async () => {
      await expect(service.ingestBatch('tenant-123', { events: [] })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSummary', () => {
    it('should compute player telemetry aggregates and category breakdown', async () => {
      const totalQb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(150),
      };

      const playerQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '42' }),
      };

      const sessionQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '68' }),
      };

      const categoryQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { category: 'GAMEPLAY', count: '100' },
          { category: 'ECONOMY', count: '50' },
        ]),
      };

      const topEventsQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { eventType: 'level_completed', count: '80' },
          { eventType: 'session_start', count: '70' },
        ]),
      };

      repository.createQueryBuilder
        .mockReturnValueOnce(totalQb)
        .mockReturnValueOnce(playerQb)
        .mockReturnValueOnce(sessionQb)
        .mockReturnValueOnce(categoryQb)
        .mockReturnValueOnce(topEventsQb);

      const summary = await service.getSummary('tenant-123');

      expect(summary.totalEvents).toBe(150);
      expect(summary.uniquePlayers).toBe(42);
      expect(summary.uniqueSessions).toBe(68);
      expect(summary.categoryBreakdown.GAMEPLAY).toBe(100);
      expect(summary.topEventTypes).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should query live event stream with filters and pagination', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockEvent], 1]),
      };

      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('tenant-123', {
        gameTitle: 'CyberArena',
        eventType: 'level_completed',
        page: 1,
        limit: 20,
      });

      expect(qb.where).toHaveBeenCalledWith('event.tenantId = :tenantId', { tenantId: 'tenant-123' });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
