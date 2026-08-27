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
import { TicketSeverity, TicketStatus, TicketPriority } from '../enums/ticket.enum';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Build } from './build.entity';

@Entity('tickets')
@Index(['tenantId', 'gameTitle'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'severity'])
@Index(['tenantId', 'assignedToUserId'])
export class Ticket {
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
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  reproductionSteps?: string;

  @Column({
    type: 'enum',
    enum: TicketSeverity,
    default: TicketSeverity.MEDIUM,
  })
  severity: TicketSeverity;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.NORMAL,
  })
  priority: TicketPriority;

  @Column({ type: 'uuid', nullable: true })
  buildId?: string;

  @ManyToOne(() => Build, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'buildId' })
  build?: Build;

  @Column({ type: 'uuid', nullable: true })
  reportedByUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reportedByUserId' })
  reportedByUser?: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedToUser?: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  environment?: string;

  @Column({ type: 'text', nullable: true })
  logsUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
