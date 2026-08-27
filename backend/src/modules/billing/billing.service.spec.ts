import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Subscription } from '../../database/entities/subscription.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { PlanTier } from '../../database/enums/plan-tier.enum';
import { SubscriptionStatus } from '../../database/enums/subscription.enum';
import { UserRole } from '../../database/enums/role.enum';

describe('BillingService (Phase 6 - Seat Limit Enforcement & Plans)', () => {
  let service: BillingService;
  let subRepo: jest.Mocked<Repository<Subscription>>;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let usersService: jest.Mocked<UsersService>;
  let tenantsService: jest.Mocked<TenantsService>;

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Mythic Realm Studios',
    slug: 'mythic-realm',
    planTier: PlanTier.FREE,
    maxSeats: 5,
    isActive: true,
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription: Subscription = {
    id: 'sub-123',
    tenantId: 'tenant-123',
    tenant: null,
    planTier: PlanTier.FREE,
    status: SubscriptionStatus.ACTIVE,
    seatsIncluded: 5,
    monthlyPriceUsd: 0,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockSubRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((sub) => Promise.resolve({ id: 'sub-123', ...sub })),
      findOne: jest.fn(),
    };

    const mockTenantRepo = {
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    };

    const mockUsersService = {
      countByTenantId: jest.fn(),
      createUser: jest.fn(),
    };

    const mockTenantsService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const map: Record<string, any> = {
          'plans.freeMaxSeats': 5,
          'plans.proMaxSeats': 25,
          'plans.enterpriseMaxSeats': 1000,
        };
        return map[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(Subscription), useValue: mockSubRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    subRepo = module.get(getRepositoryToken(Subscription));
    tenantRepo = module.get(getRepositoryToken(Tenant));
    usersService = module.get(UsersService);
    tenantsService = module.get(TenantsService);
  });

  describe('Seat Limit Enforcement', () => {
    it('should strictly throw ForbiddenException when tenant reaches seat capacity on invite', async () => {
      // Tenant has maxSeats = 5 and current seats used is 5
      tenantsService.findById.mockResolvedValue({ ...mockTenant, maxSeats: 5 });
      usersService.countByTenantId.mockResolvedValue(5);

      const inviteDto = {
        email: 'developer.six@studio.com',
        firstName: 'Dev',
        lastName: 'Six',
        temporaryPassword: 'TempPassword123!',
      };

      await expect(service.inviteMember('tenant-123', inviteDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('should allow user invite when seats are available below max limit', async () => {
      tenantsService.findById.mockResolvedValue({ ...mockTenant, maxSeats: 5 });
      usersService.countByTenantId.mockResolvedValue(3); // 3 of 5 used
      usersService.createUser.mockResolvedValue({
        id: 'new-user-id',
        tenantId: 'tenant-123',
        email: 'developer.four@studio.com',
        firstName: 'Dev',
        lastName: 'Four',
        role: UserRole.DEVELOPER,
      } as any);

      const inviteDto = {
        email: 'developer.four@studio.com',
        firstName: 'Dev',
        lastName: 'Four',
        temporaryPassword: 'TempPassword123!',
      };

      const result = await service.inviteMember('tenant-123', inviteDto);

      expect(result.success).toBe(true);
      expect(result.seatsUsed).toBe(4);
      expect(result.maxSeats).toBe(5);
      expect(usersService.createUser).toHaveBeenCalled();
    });
  });

  describe('Upgrade Plan Flow', () => {
    it('should upgrade plan tier to PRO, increase maxSeats to 25, and update billing price', async () => {
      tenantsService.findById.mockResolvedValue({ ...mockTenant });
      subRepo.findOne.mockResolvedValue({ ...mockSubscription });
      usersService.countByTenantId.mockResolvedValue(5);

      const result = await service.upgradePlan('tenant-123', PlanTier.PRO);

      expect(tenantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: PlanTier.PRO,
          maxSeats: 25,
        }),
      );
      expect(subRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          planTier: PlanTier.PRO,
          seatsIncluded: 25,
          monthlyPriceUsd: 99,
        }),
      );
      expect(result.planTier).toBe(PlanTier.PRO);
      expect(result.seats.maxSeats).toBe(25);
      expect(result.seats.availableSeats).toBe(20);
    });
  });

  describe('Subscription Details & Cancellation', () => {
    it('should return subscription details and metering stats', async () => {
      subRepo.findOne.mockResolvedValue(mockSubscription);
      usersService.countByTenantId.mockResolvedValue(2);

      const details = await service.getSubscription('tenant-123');

      expect(details.planTier).toBe(PlanTier.FREE);
      expect(details.seats.maxSeats).toBe(5);
      expect(details.seats.usedSeats).toBe(2);
      expect(details.seats.availableSeats).toBe(3);
      expect(details.seats.isSeatLimitReached).toBe(false);
    });

    it('should mark subscription to cancel at period end', async () => {
      subRepo.findOne.mockResolvedValue({ ...mockSubscription });

      const result = await service.cancelSubscription('tenant-123');

      expect(subRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ cancelAtPeriodEnd: true }),
      );
      expect(result.cancelAtPeriodEnd).toBe(true);
    });
  });
});
