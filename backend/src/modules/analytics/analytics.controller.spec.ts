import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventCategory } from '../../database/enums/analytics.enum';

describe('AnalyticsController (Phase 4)', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<AnalyticsService>;

  const mockUser = { id: 'user-1', tenantId: 'tenant-1' };

  beforeEach(async () => {
    const mockAnalyticsServiceFactory = {
      ingestSingle: jest.fn().mockResolvedValue({ success: true, eventId: 'evt-1', ingestedAt: new Date() }),
      ingestBatch: jest.fn().mockResolvedValue({ success: true, count: 2, processedAt: new Date() }),
      findAll: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 50, totalPages: 0 }),
      getSummary: jest.fn().mockResolvedValue({ totalEvents: 100, uniquePlayers: 25, uniqueSessions: 30, categoryBreakdown: {}, topEventTypes: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: mockAnalyticsServiceFactory }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  it('should call service.ingestSingle on POST /analytics/events', async () => {
    const dto = {
      gameTitle: 'Galaxy Quest',
      playerId: 'plyr_1',
      eventType: 'session_start',
      eventCategory: EventCategory.GAMEPLAY,
      clientTimestamp: '2026-08-27T10:00:00.000Z',
    };

    const result = await controller.ingestSingle(mockUser, dto);

    expect(service.ingestSingle).toHaveBeenCalledWith(mockUser.tenantId, dto);
    expect(result.success).toBe(true);
  });

  it('should call service.ingestBatch on POST /analytics/events/batch', async () => {
    const batchDto = {
      events: [
        {
          gameTitle: 'Galaxy Quest',
          playerId: 'plyr_1',
          eventType: 'session_start',
          clientTimestamp: '2026-08-27T10:00:00.000Z',
        },
      ],
    };

    const result = await controller.ingestBatch(mockUser, batchDto);

    expect(service.ingestBatch).toHaveBeenCalledWith(mockUser.tenantId, batchDto);
    expect(result.count).toBe(2);
  });

  it('should call service.findAll on GET /analytics/events', async () => {
    const query = { page: 1, limit: 50 };
    await controller.findAll(mockUser, query);

    expect(service.findAll).toHaveBeenCalledWith(mockUser.tenantId, query);
  });

  it('should call service.getSummary on GET /analytics/summary', async () => {
    const result = await controller.getSummary(mockUser, 'Galaxy Quest');

    expect(service.getSummary).toHaveBeenCalledWith(mockUser.tenantId, 'Galaxy Quest');
    expect(result.totalEvents).toBe(100);
  });
});
