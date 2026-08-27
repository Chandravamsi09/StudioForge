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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { QAService } from './qa.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketStatus } from '../../database/enums/ticket.enum';

@ApiTags('QA & Bug Tracking')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('qa/tickets')
export class QAController {
  constructor(private readonly qaService: QAService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new bug ticket / QA report' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(@CurrentUser() user: any, @Body() dto: CreateTicketDto) {
    return this.qaService.createTicket(user.tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bug tickets with filtering, severity, status, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of tickets returned' })
  async findAll(@CurrentUser() user: any, @Query() query: QueryTicketsDto) {
    return this.qaService.findAll(user.tenantId, query);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Retrieve QA health metrics, blocker counts, and resolution rate' })
  @ApiResponse({ status: 200, description: 'QA metrics returned' })
  async getMetrics(@CurrentUser() user: any) {
    return this.qaService.getMetrics(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bug ticket details by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket details returned' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.qaService.findById(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket description, reproduction steps, or severity' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicket(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.qaService.updateTicket(user.tenantId, id, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to a developer' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiBody({ schema: { properties: { assignedToUserId: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assignTicket(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('assignedToUserId') assignedToUserId: string,
  ) {
    return this.qaService.assignTicket(user.tenantId, id, assignedToUserId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition ticket status in bug lifecycle' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: Object.values(TicketStatus) } } } })
  @ApiResponse({ status: 200, description: 'Ticket status changed' })
  async changeStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.qaService.changeStatus(user.tenantId, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bug ticket' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async deleteTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.qaService.deleteTicket(user.tenantId, id);
  }
}
