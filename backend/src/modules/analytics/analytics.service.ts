import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../../database/entities/analytics-event.entity';
import { IngestEventDto } from './dto/ingest-event.dto';
import { BatchIngestDto } from './dto/batch-ingest.dto';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { EventCategory } from '../../database/enums/analytics.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async ingestSingle(tenantId: string, dto: IngestEventDto): Promise<{ success: boolean; eventId: string; ingestedAt: Date }> {
    const event = this.analyticsRepository.create({
      ...dto,
      tenantId,
      eventCategory: dto.eventCategory || EventCategory.GAMEPLAY,
      properties: dto.properties || {},
      clientTimestamp: new Date(dto.clientTimestamp),
    });

    const saved = await this.analyticsRepository.save(event);

    return {
      success: true,
      eventId: saved.id,
      ingestedAt: saved.ingestedAt,
    };
  }

  async ingestBatch(
    tenantId: string,
    dto: BatchIngestDto,
  ): Promise<{ success: boolean; count: number; processedAt: Date }> {
    if (!dto.events || dto.events.length === 0) {
      throw new BadRequestException('Batch must contain at least one event');
    }

    const eventsToInsert = dto.events.map((e) =>
      this.analyticsRepository.create({
        ...e,
        tenantId,
        eventCategory: e.eventCategory || EventCategory.GAMEPLAY,
        properties: e.properties || {},
        clientTimestamp: new Date(e.clientTimestamp),
      }),
    );

    await this.analyticsRepository.save(eventsToInsert);

    return {
      success: true,
      count: eventsToInsert.length,
      processedAt: new Date(),
    };
  }

  async findAll(tenantId: string, query: QueryAnalyticsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(200, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const qb = this.analyticsRepository
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId });

    if (query.gameTitle) {
      qb.andWhere('LOWER(event.gameTitle) LIKE LOWER(:gameTitle)', {
        gameTitle: `%${query.gameTitle}%`,
      });
    }

    if (query.eventType) {
      qb.andWhere('event.eventType = :eventType', { eventType: query.eventType });
    }

    if (query.eventCategory) {
      qb.andWhere('event.eventCategory = :category', { category: query.eventCategory });
    }

    if (query.playerId) {
      qb.andWhere('event.playerId = :playerId', { playerId: query.playerId });
    }

    if (query.startDate) {
      qb.andWhere('event.clientTimestamp >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      qb.andWhere('event.clientTimestamp <= :endDate', { endDate: new Date(query.endDate) });
    }

    qb.orderBy('event.clientTimestamp', 'DESC')
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

  async getSummary(tenantId: string, gameTitle?: string) {
    const qb = this.analyticsRepository
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId });

    if (gameTitle) {
      qb.andWhere('event.gameTitle = :gameTitle', { gameTitle });
    }

    const totalEvents = await qb.getCount();

    // Unique active players
    const uniquePlayersQuery = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.playerId)', 'count')
      .where('event.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const uniquePlayers = parseInt(uniquePlayersQuery?.count || '0', 10);

    // Unique active sessions
    const uniqueSessionsQuery = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.sessionId)', 'count')
      .where('event.tenantId = :tenantId', { tenantId })
      .andWhere('event.sessionId IS NOT NULL')
      .getRawOne();

    const uniqueSessions = parseInt(uniqueSessionsQuery?.count || '0', 10);

    // Category distribution
    const categoryStats = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.eventCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('event.tenantId = :tenantId', { tenantId })
      .groupBy('event.eventCategory')
      .getRawMany();

    // Top event types
    const topEvents = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.tenantId = :tenantId', { tenantId })
      .groupBy('event.eventType')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalEvents,
      uniquePlayers,
      uniqueSessions,
      categoryBreakdown: categoryStats.reduce(
        (acc, row) => ({ ...acc, [row.category]: parseInt(row.count, 10) }),
        {},
      ),
      topEventTypes: topEvents.map((row) => ({
        eventType: row.eventType,
        count: parseInt(row.count, 10),
      })),
    };
  }
}
