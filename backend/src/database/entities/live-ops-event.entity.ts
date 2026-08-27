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
    type: 'simple-enum',
    enum: LiveOpsEventType,
    default: LiveOpsEventType.CUSTOM,
  })
  type: LiveOpsEventType;

  @Column({
    type: 'simple-enum',
    enum: LiveOpsStatus,
    default: LiveOpsStatus.DRAFT,
  })
  status: LiveOpsStatus;

  @Column({ name: 'start_time' })
  startTime: Date;

  @Column({ name: 'end_time' })
  endTime: Date;

  @Column({ name: 'config_payload', type: 'simple-json', nullable: true })
  configPayload: Record<string, any>;

  @Column({ name: 'target_audience', type: 'varchar', length: 100, nullable: true })
  targetAudience?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
