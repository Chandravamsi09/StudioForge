import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlanTier } from '../enums/plan-tier.enum';
import { SubscriptionStatus } from '../enums/subscription.enum';
import { Tenant } from './tenant.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  tenantId: string;

  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: PlanTier,
    default: PlanTier.FREE,
  })
  planTier: PlanTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'int', default: 5 })
  seatsIncluded: number;

  @Column({ type: 'int', default: 0 })
  monthlyPriceUsd: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentProviderCustomerId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentProviderSubscriptionId?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
