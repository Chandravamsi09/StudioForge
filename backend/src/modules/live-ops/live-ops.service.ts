import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveOpsEvent } from '../../database/entities/live-ops-event.entity';
import { CreateLiveOpsDto } from './dto/create-live-ops.dto';
import { UpdateLiveOpsDto } from './dto/update-live-ops.dto';
import { QueryLiveOpsDto } from './dto/query-live-ops.dto';
import { LiveOpsStatus } from '../../database/enums/live-ops.enum';

@Injectable()
export class LiveOpsService {
  constructor(
    @InjectRepository(LiveOpsEvent)
    private readonly liveOpsRepository: Repository<LiveOpsEvent>,
  ) {}

  async createEvent(tenantId: string, userId: string, dto: CreateLiveOpsDto): Promise<LiveOpsEvent> {
    const event = this.liveOpsRepository.create({
      ...dto,
      tenantId,
      createdByUserId: userId,
      status: dto.status || LiveOpsStatus.SCHEDULED,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      configPayload: dto.configPayload || {},
    });

    return this.liveOpsRepository.save(event);
  }

  async findAll(tenantId: string, query: QueryLiveOpsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.liveOpsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdByUser', 'creator')
      .where('event.tenantId = :tenantId', { tenantId });

    if (query.gameTitle) {
      qb.andWhere('LOWER(event.gameTitle) LIKE LOWER(:gameTitle)', {
        gameTitle: `%${query.gameTitle}%`,
      });
    }

    if (query.type) {
      qb.andWhere('event.type = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(event.name) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('event.startTime', 'DESC')
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

  async findById(tenantId: string, id: string): Promise<LiveOpsEvent> {
    const event = await this.liveOpsRepository.findOne({
      where: { id, tenantId },
      relations: ['createdByUser'],
    });

    if (!event) {
      throw new NotFoundException(`Live-Ops event with ID '${id}' not found for this studio`);
    }

    return event;
  }

  async updateEvent(tenantId: string, id: string, dto: UpdateLiveOpsDto): Promise<LiveOpsEvent> {
    const event = await this.findById(tenantId, id);

    if (dto.startTime) event.startTime = new Date(dto.startTime);
    if (dto.endTime) event.endTime = new Date(dto.endTime);
    if (dto.configPayload) event.configPayload = dto.configPayload;

    Object.assign(event, dto);
    return this.liveOpsRepository.save(event);
  }

  async deleteEvent(tenantId: string, id: string): Promise<{ success: boolean; message: string }> {
    const event = await this.findById(tenantId, id);
    await this.liveOpsRepository.remove(event);

    return {
      success: true,
      message: `Live-Ops event '${event.name}' was successfully deleted`,
    };
  }

  async getActiveEventsForGame(tenantId: string, gameTitle: string) {
    const now = new Date();

    return this.liveOpsRepository
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId })
      .andWhere('LOWER(event.gameTitle) = LOWER(:gameTitle)', { gameTitle })
      .andWhere('event.status IN (:...statuses)', {
        statuses: [LiveOpsStatus.ACTIVE, LiveOpsStatus.SCHEDULED],
      })
      .andWhere('event.startTime <= :now AND event.endTime >= :now', { now })
      .orderBy('event.startTime', 'ASC')
      .getMany();
  }
}
