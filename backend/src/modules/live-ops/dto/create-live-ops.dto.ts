import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LiveOpsEventType, LiveOpsStatus } from '../../../database/enums/live-ops.enum';

export class CreateLiveOpsDto {
  @ApiProperty({ example: 'CyberArena: Legacy', description: 'Game project title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  gameTitle: string;

  @ApiProperty({ example: 'Weekend Double XP Madness', description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'All multiplayer matches yield 200% XP boost', description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: LiveOpsEventType, default: LiveOpsEventType.DOUBLE_XP })
  @IsEnum(LiveOpsEventType)
  @IsNotEmpty()
  type: LiveOpsEventType;

  @ApiPropertyOptional({ enum: LiveOpsStatus, default: LiveOpsStatus.SCHEDULED })
  @IsEnum(LiveOpsStatus)
  @IsOptional()
  status?: LiveOpsStatus;

  @ApiProperty({ example: '2026-08-28T18:00:00.000Z', description: 'Scheduled start timestamp' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2026-08-31T06:00:00.000Z', description: 'Scheduled end timestamp' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    example: { xpMultiplier: 2.0, eligibleModes: ['ranked', 'unranked'], bannerUrl: 'https://cdn.studioforge.dev/banners/2xp.png' },
    description: 'Dynamic config parameters delivered to live game clients',
  })
  @IsObject()
  @IsOptional()
  configPayload?: Record<string, any>;

  @ApiPropertyOptional({ example: 'ALL_PLAYERS', description: 'Target audience segment' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  targetAudience?: string;
}
