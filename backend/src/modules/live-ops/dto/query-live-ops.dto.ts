import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LiveOpsEventType, LiveOpsStatus } from '../../../database/enums/live-ops.enum';

export class QueryLiveOpsDto {
  @ApiPropertyOptional({ description: 'Filter by game project title' })
  @IsString()
  @IsOptional()
  gameTitle?: string;

  @ApiPropertyOptional({ enum: LiveOpsEventType, description: 'Filter by event type' })
  @IsEnum(LiveOpsEventType)
  @IsOptional()
  type?: LiveOpsEventType;

  @ApiPropertyOptional({ enum: LiveOpsStatus, description: 'Filter by status' })
  @IsEnum(LiveOpsStatus)
  @IsOptional()
  status?: LiveOpsStatus;

  @ApiPropertyOptional({ description: 'Search name and description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
