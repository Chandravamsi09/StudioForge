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
import { TargetPlatform, BuildStatus } from '../enums/build.enum';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('builds')
@Index(['tenantId', 'gameTitle'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'targetPlatform'])
export class Build {
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

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({
    type: 'simple-enum',
    enum: TargetPlatform,
    default: TargetPlatform.WINDOWS,
  })
  targetPlatform: TargetPlatform;

  @Column({
    type: 'simple-enum',
    enum: BuildStatus,
    default: BuildStatus.QUEUED,
  })
  status: BuildStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  commitHash?: string;

  @Column({ type: 'varchar', length: 100, default: 'main' })
  branch: string;

  @Column({ type: 'text', nullable: true })
  artifactUrl?: string;

  @Column({ type: 'bigint', nullable: true })
  artifactSizeBytes?: number;

  @Column({ type: 'int', nullable: true })
  buildDurationSeconds?: number;

  @Column({ type: 'text', nullable: true })
  changelog?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

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
