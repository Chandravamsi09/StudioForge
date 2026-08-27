import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LiveOpsService } from './live-ops.service';
import { CreateLiveOpsDto } from './dto/create-live-ops.dto';
import { UpdateLiveOpsDto } from './dto/update-live-ops.dto';
import { QueryLiveOpsDto } from './dto/query-live-ops.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Live-Ops Console & Feature Flags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('live-ops')
export class LiveOpsController {
  constructor(private readonly liveOpsService: LiveOpsService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a new live-ops event, feature flag, or economy override' })
  @ApiResponse({ status: 201, description: 'Live-ops event created' })
  async createEvent(@CurrentUser() user: any, @Body() dto: CreateLiveOpsDto) {
    return this.liveOpsService.createEvent(user.tenantId, user.id, dto);
  }

  @Get('events')
  @ApiOperation({ summary: 'List live-ops events with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of live-ops events' })
  async findAll(@CurrentUser() user: any, @Query() query: QueryLiveOpsDto) {
    return this.liveOpsService.findAll(user.tenantId, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active live-ops events for a game title' })
  @ApiResponse({ status: 200, description: 'Active live configs returned' })
  async getActiveEvents(
    @CurrentUser() user: any,
    @Query('gameTitle') gameTitle: string,
  ) {
    return this.liveOpsService.getActiveEventsForGame(user.tenantId, gameTitle);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get live-ops event details by ID' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Live-ops event details returned' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveOpsService.findById(user.tenantId, id);
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update live-ops event config or dates' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLiveOpsDto,
  ) {
    return this.liveOpsService.updateEvent(user.tenantId, id, dto);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete a live-ops event' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveOpsService.deleteEvent(user.tenantId, id);
  }
}
