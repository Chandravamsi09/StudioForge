import { Test, TestingModule } from '@nestjs/testing';
import { LiveOpsController } from './live-ops.controller';
import { LiveOpsService } from './live-ops.service';
import { LiveOpsEventType, LiveOpsStatus } from '../../database/enums/live-ops.enum';

describe('LiveOpsController (Phase 5)', () => {
  let controller: LiveOpsController;
  let service: jest.Mocked<LiveOpsService>;

  const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
  const mockEvent = {
    id: 'liveops-1',
    tenantId: 'tenant-1',
    gameTitle: 'Galaxy Quest',
    name: 'Season 1 Tournament',
    type: LiveOpsEventType.TOURNAMENT,
    status: LiveOpsStatus.SCHEDULED,
    startTime: new Date(),
    endTime: new Date(),
    configPayload: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockLiveOpsServiceFactory = {
      createEvent: jest.fn().mockResolvedValue(mockEvent),
      findAll: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1, page: 1, limit: 20, totalPages: 1 }),
      getActiveEventsForGame: jest.fn().mockResolvedValue([mockEvent]),
      findById: jest.fn().mockResolvedValue(mockEvent),
      updateEvent: jest.fn().mockResolvedValue({ ...mockEvent, status: LiveOpsStatus.ACTIVE }),
      deleteEvent: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveOpsController],
      providers: [{ provide: LiveOpsService, useValue: mockLiveOpsServiceFactory }],
    }).compile();

    controller = module.get<LiveOpsController>(LiveOpsController);
    service = module.get(LiveOpsService);
  });

  it('should call service.createEvent on POST /live-ops/events', async () => {
    const dto = {
      gameTitle: 'Galaxy Quest',
      name: 'Season 1 Tournament',
      type: LiveOpsEventType.TOURNAMENT,
      startTime: '2026-08-28T00:00:00.000Z',
      endTime: '2026-08-30T00:00:00.000Z',
    };

    const result = await controller.createEvent(mockUser, dto);

    expect(service.createEvent).toHaveBeenCalledWith(mockUser.tenantId, mockUser.id, dto);
    expect(result.id).toBe('liveops-1');
  });

  it('should call service.getActiveEventsForGame on GET /live-ops/active', async () => {
    const result = await controller.getActiveEvents(mockUser, 'Galaxy Quest');

    expect(service.getActiveEventsForGame).toHaveBeenCalledWith(mockUser.tenantId, 'Galaxy Quest');
    expect(result).toHaveLength(1);
  });
});
