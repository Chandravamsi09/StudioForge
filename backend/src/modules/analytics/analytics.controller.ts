import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { IngestEventDto } from './dto/ingest-event.dto';
import { BatchIngestDto } from './dto/batch-ingest.dto';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Player Analytics & Telemetry')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest a single player telemetry event' })
  @ApiResponse({ status: 201, description: 'Event successfully ingested' })
  @ApiResponse({ status: 400, description: 'Malformed event payload rejected' })
  async ingestSingle(@CurrentUser() user: any, @Body() dto: IngestEventDto) {
    return this.analyticsService.ingestSingle(user.tenantId, dto);
  }

  @Post('events/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Batch ingest player telemetry events (up to 500 events per request)' })
  @ApiResponse({ status: 201, description: 'Batch events successfully ingested' })
  @ApiResponse({ status: 400, description: 'Batch validation failed or empty array' })
  async ingestBatch(@CurrentUser() user: any, @Body() dto: BatchIngestDto) {
    return this.analyticsService.ingestBatch(user.tenantId, dto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Query and filter the live player telemetry event stream' })
  @ApiResponse({ status: 200, description: 'Paginated events stream returned' })
  async findAll(@CurrentUser() user: any, @Query() query: QueryAnalyticsDto) {
    return this.analyticsService.findAll(user.tenantId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Retrieve player engagement metrics, active players, and category breakdown' })
  @ApiResponse({ status: 200, description: 'Telemetry summary returned' })
  async getSummary(@CurrentUser() user: any, @Query('gameTitle') gameTitle?: string) {
    return this.analyticsService.getSummary(user.tenantId, gameTitle);
  }
}
