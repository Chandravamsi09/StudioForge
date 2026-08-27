import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { QAService } from './qa.service';
import { Ticket } from '../../database/entities/ticket.entity';
import { TicketSeverity, TicketStatus, TicketPriority } from '../../database/enums/ticket.enum';

describe('QAService (Phase 3)', () => {
  let service: QAService;
  let repository: jest.Mocked<Repository<Ticket>>;

  const mockTicket: Ticket = {
    id: 'ticket-123',
    tenantId: 'tenant-123',
    tenant: null,
    gameTitle: 'CyberArena: Legacy',
    title: 'Elevator collision glitch',
    description: 'Player falls through elevator floor',
    reproductionSteps: '1. Crouch while elevator descends',
    severity: TicketSeverity.HIGH,
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    buildId: 'build-123',
    build: null,
    reportedByUserId: 'qa-user-1',
    reportedByUser: null,
    assignedToUserId: null,
    assignedToUser: null,
    environment: 'Windows 11 / RTX 4080',
    logsUrl: 'https://logs.studioforge.dev/crash.log',
    tags: ['physics', 'elevator'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((ticket) => Promise.resolve({ id: 'ticket-123', ...ticket })),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(mockTicket),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QAService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<QAService>(QAService);
    repository = module.get(getRepositoryToken(Ticket));
  });

  describe('createTicket', () => {
    it('should create a QA ticket scoped to tenant with defaults', async () => {
      const dto = {
        gameTitle: 'CyberArena: Legacy',
        title: 'Elevator collision glitch',
        description: 'Player falls through floor',
      };

      const result = await service.createTicket('tenant-123', 'qa-user-1', dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'tenant-123',
        reportedByUserId: 'qa-user-1',
        status: TicketStatus.OPEN,
        severity: TicketSeverity.MEDIUM,
      });
      expect(result.id).toBe('ticket-123');
    });
  });

  describe('findById', () => {
    it('should return ticket if exists within the same tenant', async () => {
      repository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findById('tenant-123', 'ticket-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-123', tenantId: 'tenant-123' },
        relations: ['reportedByUser', 'assignedToUser', 'build'],
      });
      expect(result.id).toBe('ticket-123');
    });

    it('should throw NotFoundException if ticket does not exist or belongs to another tenant', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('other-tenant', 'ticket-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket and advance status from OPEN to IN_PROGRESS', async () => {
      repository.findOne.mockResolvedValue({ ...mockTicket, status: TicketStatus.OPEN });

      const result = await service.assignTicket('tenant-123', 'ticket-123', 'dev-user-99');

      expect(repository.save).toHaveBeenCalled();
      expect(result.assignedToUserId).toBe('dev-user-99');
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });
  });

  describe('changeStatus', () => {
    it('should update ticket status in lifecycle', async () => {
      repository.findOne.mockResolvedValue({ ...mockTicket });

      const result = await service.changeStatus('tenant-123', 'ticket-123', TicketStatus.RESOLVED);

      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(TicketStatus.RESOLVED);
    });
  });

  describe('deleteTicket', () => {
    it('should remove ticket and return success confirmation', async () => {
      repository.findOne.mockResolvedValue(mockTicket);

      const result = await service.deleteTicket('tenant-123', 'ticket-123');

      expect(repository.remove).toHaveBeenCalledWith(mockTicket);
      expect(result.success).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should calculate QA bug tracking metrics, blocker count, and resolution rate', async () => {
      repository.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(5)  // open
        .mockResolvedValueOnce(5)  // in progress
        .mockResolvedValueOnce(2)  // in review
        .mockResolvedValueOnce(6)  // resolved
        .mockResolvedValueOnce(2)  // closed
        .mockResolvedValueOnce(1)  // blockers
        .mockResolvedValueOnce(3); // critical

      const metrics = await service.getMetrics('tenant-123');

      expect(metrics.totalTickets).toBe(20);
      expect(metrics.openTickets).toBe(5);
      expect(metrics.blockerCount).toBe(1);
      expect(metrics.criticalCount).toBe(3);
      expect(metrics.resolutionRate).toBe('40.0%'); // (6 + 2) / 20 = 40%
    });
  });

  describe('findAll', () => {
    it('should query tickets with filters and pagination', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTicket], 1]),
      };

      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('tenant-123', {
        severity: TicketSeverity.HIGH,
        status: TicketStatus.OPEN,
        search: 'elevator',
        page: 1,
        limit: 10,
      });

      expect(qb.where).toHaveBeenCalledWith('ticket.tenantId = :tenantId', { tenantId: 'tenant-123' });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
