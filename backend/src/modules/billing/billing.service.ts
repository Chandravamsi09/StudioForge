import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription } from '../../database/entities/subscription.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { PlanTier } from '../../database/enums/plan-tier.enum';
import { SubscriptionStatus } from '../../database/enums/subscription.enum';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly configService: ConfigService,
  ) {}

  async getSubscription(tenantId: string) {
    const tenant = await this.tenantsService.findById(tenantId);
    let subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        tenantId,
        planTier: tenant.planTier,
        status: SubscriptionStatus.ACTIVE,
        seatsIncluded: tenant.maxSeats,
        monthlyPriceUsd: this.getPriceForPlan(tenant.planTier),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      subscription = await this.subscriptionRepository.save(subscription);
    }

    const currentSeatsUsed = await this.usersService.countByTenantId(tenantId);
    const seatsRemaining = Math.max(0, tenant.maxSeats - currentSeatsUsed);

    return {
      id: subscription.id,
      tenantId,
      tenantName: tenant.name,
      planTier: tenant.planTier,
      status: subscription.status,
      monthlyPriceUsd: subscription.monthlyPriceUsd,
      seats: {
        maxSeats: tenant.maxSeats,
        usedSeats: currentSeatsUsed,
        availableSeats: seatsRemaining,
        isSeatLimitReached: currentSeatsUsed >= tenant.maxSeats,
      },
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  async upgradePlan(tenantId: string, newPlanTier: PlanTier) {
    const tenant = await this.tenantsService.findById(tenantId);

    const maxSeats = this.getMaxSeatsForPlan(newPlanTier);
    const monthlyPrice = this.getPriceForPlan(newPlanTier);

    tenant.planTier = newPlanTier;
    tenant.maxSeats = maxSeats;
    await this.tenantRepository.save(tenant);

    let subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        tenantId,
        planTier: newPlanTier,
        status: SubscriptionStatus.ACTIVE,
        seatsIncluded: maxSeats,
        monthlyPriceUsd: monthlyPrice,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    } else {
      subscription.planTier = newPlanTier;
      subscription.seatsIncluded = maxSeats;
      subscription.monthlyPriceUsd = monthlyPrice;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.cancelAtPeriodEnd = false;
    }

    await this.subscriptionRepository.save(subscription);

    return this.getSubscription(tenantId);
  }

  async cancelSubscription(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.cancelAtPeriodEnd = true;
    await this.subscriptionRepository.save(subscription);

    return {
      success: true,
      message: 'Subscription marked to cancel at the end of the current billing period',
      cancelAtPeriodEnd: true,
    };
  }

  async inviteMember(tenantId: string, dto: InviteMemberDto) {
    const tenant = await this.tenantsService.findById(tenantId);
    const currentSeatsUsed = await this.usersService.countByTenantId(tenantId);

    // CRITICAL REQUIREMENT: Seat limit enforcement
    if (currentSeatsUsed >= tenant.maxSeats) {
      throw new ForbiddenException(
        `Seat limit reached (${currentSeatsUsed}/${tenant.maxSeats}). Upgrade your subscription plan tier to add more team members.`,
      );
    }

    const newUser = await this.usersService.createUser({
      tenantId,
      email: dto.email,
      password: dto.temporaryPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    });

    return {
      success: true,
      message: `User '${newUser.email}' successfully added to studio organization`,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tenantId: newUser.tenantId,
      },
      seatsUsed: currentSeatsUsed + 1,
      maxSeats: tenant.maxSeats,
    };
  }

  private getMaxSeatsForPlan(plan: PlanTier): number {
    switch (plan) {
      case PlanTier.PRO:
        return this.configService.get<number>('plans.proMaxSeats', 25);
      case PlanTier.ENTERPRISE:
        return this.configService.get<number>('plans.enterpriseMaxSeats', 1000);
      case PlanTier.FREE:
      default:
        return this.configService.get<number>('plans.freeMaxSeats', 5);
    }
  }

  private getPriceForPlan(plan: PlanTier): number {
    switch (plan) {
      case PlanTier.PRO:
        return 99;
      case PlanTier.ENTERPRISE:
        return 499;
      case PlanTier.FREE:
      default:
        return 0;
    }
  }
}
