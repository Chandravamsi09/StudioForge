import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { LiveOpsService } from './live-ops.service';
import { LiveOpsEvent } from '../../database/entities/live-ops-event.entity';
import { LiveOpsEventType, LiveOpsStatus } from '../../database/enums/live-ops.enum';

describe('LiveOpsService (Phase 5)', () => {
  let service: LiveOpsService;
  let repository: jest.Mocked<Repository<LiveOpsEvent>>;

  const mockLiveOpsEvent: LiveOpsEvent = {
    id: 'liveops-123',
    tenantId: 'tenant-123',
    tenant: null,
    gameTitle: 'CyberArena: Legacy',
    name: 'Weekend Double XP Madness',
    description: 'Double XP in ranked',
    type: LiveOpsEventType.DOUBLE_XP,
    status: LiveOpsStatus.SCHEDULED,
    startTime: new Date('2026-08-28T18:00:00.000Z'),
    endTime: new Date('2026-08-31T06:00:00.000Z'),
    configPayload: { xpMultiplier: 2.0 },
    targetAudience: 'ALL_PLAYERS',
    createdByUserId: 'user-1',
    createdByUser: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((event) => Promise.resolve({ id: 'liveops-123', ...event })),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(mockLiveOpsEvent),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveOpsService,
        {
          provide: getRepositoryToken(LiveOpsEvent),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<LiveOpsService>(LiveOpsService);
    repository = module.get(getRepositoryToken(LiveOpsEvent));
  });

  describe('createEvent', () => {
    it('should create a scheduled live-ops event scoped to tenant', async () => {
      const dto = {
        gameTitle: 'CyberArena: Legacy',
        name: 'Weekend Double XP Madness',
        type: LiveOpsEventType.DOUBLE_XP,
        startTime: '2026-08-28T18:00:00.000Z',
        endTime: '2026-08-31T06:00:00.000Z',
        configPayload: { xpMultiplier: 2.0 },
      };

      const result = await service.createEvent('tenant-123', 'user-1', dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          createdByUserId: 'user-1',
          name: 'Weekend Double XP Madness',
        }),
      );
      expect(result.id).toBe('liveops-123');
    });
  });

  describe('findById', () => {
    it('should find live-ops event if scoped to caller tenant', async () => {
      repository.findOne.mockResolvedValue(mockLiveOpsEvent);

      const result = await service.findById('tenant-123', 'liveops-123');

      expect(result.id).toBe('liveops-123');
    });

    it('should throw NotFoundException if event does not belong to tenant', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('other-tenant', 'liveops-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveEventsForGame', () => {
    it('should return currently active live-ops events for game clients', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLiveOpsEvent]),
      };

      repository.createQueryBuilder.mockReturnValue(qb);

      const active = await service.getActiveEventsForGame('tenant-123', 'cyberarena');

      expect(qb.where).toHaveBeenCalledWith('event.tenantId = :tenantId', { tenantId: 'tenant-123' });
      expect(active).toHaveLength(1);
    });
  });
});
