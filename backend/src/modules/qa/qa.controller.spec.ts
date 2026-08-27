import { Test, TestingModule } from '@nestjs/testing';
import { QAController } from './qa.controller';
import { QAService } from './qa.service';
import { TicketSeverity, TicketStatus, TicketPriority } from '../../database/enums/ticket.enum';

describe('QAController (Phase 3)', () => {
  let controller: QAController;
  let service: jest.Mocked<QAService>;

  const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
  const mockTicket = {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    gameTitle: 'Galaxy Quest',
    title: 'Camera clipping',
    description: 'Camera clips through walls',
    severity: TicketSeverity.MEDIUM,
    status: TicketStatus.OPEN,
    priority: TicketPriority.NORMAL,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQAServiceFactory = {
      createTicket: jest.fn().mockResolvedValue(mockTicket),
      findAll: jest.fn().mockResolvedValue({ items: [mockTicket], total: 1, page: 1, limit: 20, totalPages: 1 }),
      findById: jest.fn().mockResolvedValue(mockTicket),
      updateTicket: jest.fn().mockResolvedValue({ ...mockTicket, description: 'Updated' }),
      assignTicket: jest.fn().mockResolvedValue({ ...mockTicket, assignedToUserId: 'dev-2', status: TicketStatus.IN_PROGRESS }),
      changeStatus: jest.fn().mockResolvedValue({ ...mockTicket, status: TicketStatus.RESOLVED }),
      deleteTicket: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      getMetrics: jest.fn().mockResolvedValue({ totalTickets: 1, openTickets: 1, resolutionRate: '0%' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QAController],
      providers: [{ provide: QAService, useValue: mockQAServiceFactory }],
    }).compile();

    controller = module.get<QAController>(QAController);
    service = module.get(QAService);
  });

  it('should call service.createTicket on POST /qa/tickets', async () => {
    const dto = { gameTitle: 'Galaxy Quest', title: 'Camera clipping', description: 'Camera clips through walls' };
    const result = await controller.createTicket(mockUser, dto);

    expect(service.createTicket).toHaveBeenCalledWith(mockUser.tenantId, mockUser.id, dto);
    expect(result.id).toBe('ticket-1');
  });

  it('should call service.findAll on GET /qa/tickets', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAll(mockUser, query);

    expect(service.findAll).toHaveBeenCalledWith(mockUser.tenantId, query);
    expect(result.items).toHaveLength(1);
  });

  it('should call service.findById on GET /qa/tickets/:id', async () => {
    const result = await controller.findById(mockUser, 'ticket-1');

    expect(service.findById).toHaveBeenCalledWith(mockUser.tenantId, 'ticket-1');
    expect(result.id).toBe('ticket-1');
  });

  it('should call service.assignTicket on PATCH /qa/tickets/:id/assign', async () => {
    const result = await controller.assignTicket(mockUser, 'ticket-1', 'dev-2');

    expect(service.assignTicket).toHaveBeenCalledWith(mockUser.tenantId, 'ticket-1', 'dev-2');
    expect(result.assignedToUserId).toBe('dev-2');
  });

  it('should call service.changeStatus on PATCH /qa/tickets/:id/status', async () => {
    const result = await controller.changeStatus(mockUser, 'ticket-1', TicketStatus.RESOLVED);

    expect(service.changeStatus).toHaveBeenCalledWith(mockUser.tenantId, 'ticket-1', TicketStatus.RESOLVED);
    expect(result.status).toBe(TicketStatus.RESOLVED);
  });

  it('should call service.deleteTicket on DELETE /qa/tickets/:id', async () => {
    const result = await controller.deleteTicket(mockUser, 'ticket-1');

    expect(service.deleteTicket).toHaveBeenCalledWith(mockUser.tenantId, 'ticket-1');
    expect(result.success).toBe(true);
  });

  it('should call service.getMetrics on GET /qa/tickets/metrics', async () => {
    const result = await controller.getMetrics(mockUser);

    expect(service.getMetrics).toHaveBeenCalledWith(mockUser.tenantId);
    expect(result.totalTickets).toBe(1);
  });
});
