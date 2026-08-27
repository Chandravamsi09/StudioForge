import { IsEnum, IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory } from '../../../database/enums/analytics.enum';

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Filter by game title' })
  @IsString()
  @IsOptional()
  gameTitle?: string;

  @ApiPropertyOptional({ description: 'Filter by event type' })
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiPropertyOptional({ enum: EventCategory, description: 'Filter by event category' })
  @IsEnum(EventCategory)
  @IsOptional()
  eventCategory?: EventCategory;

  @ApiPropertyOptional({ description: 'Filter by player ID' })
  @IsString()
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({ description: 'Filter events after this ISO date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter events before this ISO date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;
}
