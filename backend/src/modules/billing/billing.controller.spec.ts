import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlanTier } from '../../database/enums/plan-tier.enum';
import { SubscriptionStatus } from '../../database/enums/subscription.enum';

describe('BillingController (Phase 6)', () => {
  let controller: BillingController;
  let service: jest.Mocked<BillingService>;

  const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
  const mockSubDetails = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    tenantName: 'Studio 1',
    planTier: PlanTier.FREE,
    status: SubscriptionStatus.ACTIVE,
    monthlyPriceUsd: 0,
    seats: { maxSeats: 5, usedSeats: 2, availableSeats: 3, isSeatLimitReached: false },
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(),
    cancelAtPeriodEnd: false,
  };

  beforeEach(async () => {
    const mockBillingServiceFactory = {
      getSubscription: jest.fn().mockResolvedValue(mockSubDetails),
      upgradePlan: jest.fn().mockResolvedValue({ ...mockSubDetails, planTier: PlanTier.PRO, seats: { maxSeats: 25, usedSeats: 2, availableSeats: 23, isSeatLimitReached: false } }),
      cancelSubscription: jest.fn().mockResolvedValue({ success: true, message: 'Cancelled', cancelAtPeriodEnd: true }),
      inviteMember: jest.fn().mockResolvedValue({ success: true, message: 'User invited', seatsUsed: 3, maxSeats: 5 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: mockBillingServiceFactory }],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    service = module.get(BillingService);
  });

  it('should call service.getSubscription on GET /billing/subscription', async () => {
    const result = await controller.getSubscription(mockUser);

    expect(service.getSubscription).toHaveBeenCalledWith(mockUser.tenantId);
    expect(result.planTier).toBe(PlanTier.FREE);
  });

  it('should call service.upgradePlan on POST /billing/upgrade', async () => {
    const result = await controller.upgradePlan(mockUser, { planTier: PlanTier.PRO });

    expect(service.upgradePlan).toHaveBeenCalledWith(mockUser.tenantId, PlanTier.PRO);
    expect(result.planTier).toBe(PlanTier.PRO);
  });

  it('should call service.cancelSubscription on POST /billing/cancel', async () => {
    const result = await controller.cancelSubscription(mockUser);

    expect(service.cancelSubscription).toHaveBeenCalledWith(mockUser.tenantId);
    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  it('should call service.inviteMember on POST /billing/invite', async () => {
    const dto = {
      email: 'new.member@studio.com',
      firstName: 'New',
      lastName: 'Member',
      temporaryPassword: 'TempPassword123!',
    };

    const result = await controller.inviteMember(mockUser, dto);

    expect(service.inviteMember).toHaveBeenCalledWith(mockUser.tenantId, dto);
    expect(result.seatsUsed).toBe(3);
  });
});
