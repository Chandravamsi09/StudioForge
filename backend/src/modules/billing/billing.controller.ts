import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Billing & Subscriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription details, seat limits, and usage metering' })
  @ApiResponse({ status: 200, description: 'Subscription details returned' })
  async getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.tenantId);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade subscription tier (e.g. to PRO or ENTERPRISE)' })
  @ApiResponse({ status: 200, description: 'Subscription plan updated' })
  async upgradePlan(@CurrentUser() user: any, @Body() dto: UpgradePlanDto) {
    return this.billingService.upgradePlan(user.tenantId, dto.planTier);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule subscription cancellation at period end' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled at period end' })
  async cancelSubscription(@CurrentUser() user: any) {
    return this.billingService.cancelSubscription(user.tenantId);
  }

  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a new team member with automated seat limit enforcement' })
  @ApiResponse({ status: 201, description: 'Team member added successfully' })
  @ApiResponse({ status: 403, description: 'Seat limit reached for current subscription tier' })
  async inviteMember(@CurrentUser() user: any, @Body() dto: InviteMemberDto) {
    return this.billingService.inviteMember(user.tenantId, dto);
  }
}
