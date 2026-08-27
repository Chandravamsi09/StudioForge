import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketSeverity, TicketStatus, TicketPriority } from '../../../database/enums/ticket.enum';

export class QueryTicketsDto {
  @ApiPropertyOptional({ description: 'Filter by game project title' })
  @IsString()
  @IsOptional()
  gameTitle?: string;

  @ApiPropertyOptional({ enum: TicketSeverity, description: 'Filter by severity' })
  @IsEnum(TicketSeverity)
  @IsOptional()
  severity?: TicketSeverity;

  @ApiPropertyOptional({ enum: TicketStatus, description: 'Filter by status' })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority, description: 'Filter by priority' })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Filter by assigned developer UUID' })
  @IsUUID()
  @IsOptional()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by build UUID' })
  @IsUUID()
  @IsOptional()
  buildId?: string;

  @ApiPropertyOptional({ description: 'Search title and description' })
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
