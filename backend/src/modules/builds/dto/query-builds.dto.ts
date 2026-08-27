import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TargetPlatform, BuildStatus } from '../../../database/enums/build.enum';

export class QueryBuildsDto {
  @ApiPropertyOptional({ description: 'Filter by game project title' })
  @IsString()
  @IsOptional()
  gameTitle?: string;

  @ApiPropertyOptional({ enum: TargetPlatform, description: 'Filter by target platform' })
  @IsEnum(TargetPlatform)
  @IsOptional()
  targetPlatform?: TargetPlatform;

  @ApiPropertyOptional({ enum: BuildStatus, description: 'Filter by status' })
  @IsEnum(BuildStatus)
  @IsOptional()
  status?: BuildStatus;

  @ApiPropertyOptional({ description: 'Search version or commit' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
