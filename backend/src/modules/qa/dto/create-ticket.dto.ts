import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketSeverity, TicketStatus, TicketPriority } from '../../../database/enums/ticket.enum';

export class CreateTicketDto {
  @ApiProperty({ example: 'CyberArena: Legacy', description: 'Game project title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  gameTitle: string;

  @ApiProperty({ example: 'Physics collision glitch on level 3 elevator', description: 'Bug title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Player model phases through elevator floor when crouching during descent.', description: 'Detailed bug description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: '1. Load level 3\n2. Step onto elevator\n3. Press activate and immediately crouch', description: 'Reproduction steps' })
  @IsString()
  @IsOptional()
  reproductionSteps?: string;

  @ApiPropertyOptional({ enum: TicketSeverity, default: TicketSeverity.MEDIUM })
  @IsEnum(TicketSeverity)
  @IsOptional()
  severity?: TicketSeverity;

  @ApiPropertyOptional({ enum: TicketStatus, default: TicketStatus.OPEN })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.NORMAL })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: 'e3fae574-8b65-4f3b-8f3a-1a2b3c4d5e6f', description: 'Associated build UUID' })
  @IsUUID()
  @IsOptional()
  buildId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'Assigned developer UUID' })
  @IsUUID()
  @IsOptional()
  assignedToUserId?: string;

  @ApiPropertyOptional({ example: 'Windows 11 / DX12 / RTX 4080', description: 'Test environment specs' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  environment?: string;

  @ApiPropertyOptional({ example: 'https://logs.studioforge.dev/crash-dumps/dump-9912.log', description: 'Log / crash dump URL' })
  @IsString()
  @IsOptional()
  logsUrl?: string;

  @ApiPropertyOptional({ example: ['physics', 'elevator', 'level-3'], description: 'Categorization tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
