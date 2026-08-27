import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LiveOpsEventType, LiveOpsStatus } from '../enums/live-ops.enum';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('live_ops_events')
@Index(['tenantId', 'gameTitle'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
export class LiveOpsEvent {
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

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: LiveOpsEventType,
    default: LiveOpsEventType.CUSTOM,
  })
  type: LiveOpsEventType;

  @Column({
    type: 'enum',
    enum: LiveOpsStatus,
    default: LiveOpsStatus.DRAFT,
  })
  status: LiveOpsStatus;

  @Column({ type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone' })
  endTime: Date;

  @Column({ type: 'jsonb', default: {} })
  configPayload: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  targetAudience?: string; // e.g., "ALL_PLAYERS", "VIP", "LEVEL_GREATER_THAN_10"

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser?: User;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
