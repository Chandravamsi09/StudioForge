import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../database/entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { TicketStatus, TicketSeverity } from '../../database/enums/ticket.enum';

@Injectable()
export class QAService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async createTicket(tenantId: string, userId: string, dto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ...dto,
      tenantId,
      reportedByUserId: userId,
      status: dto.status || TicketStatus.OPEN,
      severity: dto.severity || TicketSeverity.MEDIUM,
    });

    return this.ticketRepository.save(ticket);
  }

  async findAll(tenantId: string, query: QueryTicketsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.reportedByUser', 'reporter')
      .leftJoinAndSelect('ticket.assignedToUser', 'assignee')
      .leftJoinAndSelect('ticket.build', 'build')
      .where('ticket.tenantId = :tenantId', { tenantId });

    if (query.gameTitle) {
      qb.andWhere('LOWER(ticket.gameTitle) LIKE LOWER(:gameTitle)', {
        gameTitle: `%${query.gameTitle}%`,
      });
    }

    if (query.severity) {
      qb.andWhere('ticket.severity = :severity', { severity: query.severity });
    }

    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: query.priority });
    }

    if (query.assignedToUserId) {
      qb.andWhere('ticket.assignedToUserId = :assignedTo', { assignedTo: query.assignedToUserId });
    }

    if (query.buildId) {
      qb.andWhere('ticket.buildId = :buildId', { buildId: query.buildId });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(ticket.title) LIKE LOWER(:search) OR LOWER(ticket.description) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, tenantId },
      relations: ['reportedByUser', 'assignedToUser', 'build'],
    });

    if (!ticket) {
      throw new NotFoundException(`QA Ticket with ID '${id}' not found for this studio`);
    }

    return ticket;
  }

  async updateTicket(tenantId: string, id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findById(tenantId, id);

    Object.assign(ticket, dto);
    return this.ticketRepository.save(ticket);
  }

  async assignTicket(tenantId: string, id: string, assignedToUserId: string): Promise<Ticket> {
    const ticket = await this.findById(tenantId, id);
    ticket.assignedToUserId = assignedToUserId;

    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    return this.ticketRepository.save(ticket);
  }

  async changeStatus(tenantId: string, id: string, status: TicketStatus): Promise<Ticket> {
    const ticket = await this.findById(tenantId, id);
    ticket.status = status;

    return this.ticketRepository.save(ticket);
  }

  async deleteTicket(tenantId: string, id: string): Promise<{ success: boolean; message: string }> {
    const ticket = await this.findById(tenantId, id);
    await this.ticketRepository.remove(ticket);

    return {
      success: true,
      message: `QA Ticket '${ticket.title}' was successfully deleted`,
    };
  }

  async getMetrics(tenantId: string) {
    const total = await this.ticketRepository.count({ where: { tenantId } });
    const open = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.OPEN },
    });
    const inProgress = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.IN_PROGRESS },
    });
    const inReview = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.IN_REVIEW },
    });
    const resolved = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.RESOLVED },
    });
    const closed = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.CLOSED },
    });

    const blockers = await this.ticketRepository.count({
      where: { tenantId, severity: TicketSeverity.BLOCKER },
    });
    const critical = await this.ticketRepository.count({
      where: { tenantId, severity: TicketSeverity.CRITICAL },
    });

    const resolutionRate = total > 0 ? (((resolved + closed) / total) * 100).toFixed(1) : '0';

    return {
      totalTickets: total,
      openTickets: open,
      inProgressTickets: inProgress,
      inReviewTickets: inReview,
      resolvedTickets: resolved,
      closedTickets: closed,
      blockerCount: blockers,
      criticalCount: critical,
      resolutionRate: `${resolutionRate}%`,
    };
  }
}
