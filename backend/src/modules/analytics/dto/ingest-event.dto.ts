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
import { EventCategory } from '../../../database/enums/analytics.enum';

export class IngestEventDto {
  @ApiProperty({ example: 'CyberArena: Legacy', description: 'Game project title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  gameTitle: string;

  @ApiProperty({ example: 'plyr_9824a71b', description: 'Unique anonymized game player ID' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  playerId: string;

  @ApiPropertyOptional({ example: 'sess_11223344', description: 'Game session ID' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;

  @ApiProperty({ example: 'level_completed', description: 'Telemetry event type identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType: string;

  @ApiPropertyOptional({ enum: EventCategory, default: EventCategory.GAMEPLAY })
  @IsEnum(EventCategory)
  @IsOptional()
  eventCategory?: EventCategory;

  @ApiPropertyOptional({ example: 'WINDOWS', description: 'Client platform' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  platform?: string;

  @ApiPropertyOptional({ example: 'v1.4.0', description: 'Game client build version' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  gameVersion?: string;

  @ApiPropertyOptional({
    example: { level: 3, score: 9400, timeTakenSeconds: 142, difficulty: 'hard' },
    description: 'Custom key-value telemetry properties',
  })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiProperty({ example: '2026-08-27T10:00:00.000Z', description: 'Client-side ISO 8601 timestamp' })
  @IsDateString()
  @IsNotEmpty()
  clientTimestamp: string;
}
