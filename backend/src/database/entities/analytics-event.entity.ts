import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventCategory } from '../enums/analytics.enum';
import { Tenant } from './tenant.entity';

@Entity('analytics_events')
@Index(['tenantId', 'gameTitle'])
@Index(['tenantId', 'eventType'])
@Index(['tenantId', 'eventCategory'])
@Index(['tenantId', 'playerId'])
@Index(['tenantId', 'clientTimestamp'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 150 })
  gameTitle: string;

  @Column({ type: 'varchar', length: 100 })
  playerId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId?: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({
    type: 'enum',
    enum: EventCategory,
    default: EventCategory.GAMEPLAY,
  })
  eventCategory: EventCategory;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gameVersion?: string;

  @Column({ type: 'jsonb', default: {} })
  properties: Record<string, any>;

  @Column({ type: 'timestamp with time zone' })
  clientTimestamp: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  ingestedAt: Date;
}
