import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { TenantsService } from '../../modules/tenants/tenants.service';
import { PlanTier } from '../../database/enums/plan-tier.enum';

describe('TenantContextMiddleware (Phase 5)', () => {
  let middleware: TenantContextMiddleware;
  let tenantsService: jest.Mocked<TenantsService>;

  const mockActiveTenant = {
    id: 'tenant-123',
    name: 'Studio Alpha',
    slug: 'studio-alpha',
    planTier: PlanTier.PRO,
    maxSeats: 25,
    isActive: true,
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    tenantsService = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      createTenant: jest.fn(),
    } as any;

    middleware = new TenantContextMiddleware(tenantsService);
  });

  it('should pass through when no tenant header is provided (e.g. public routes)', async () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantId).toBeUndefined();
  });

  it('should resolve and attach active tenant when valid x-tenant-id is provided', async () => {
    tenantsService.findById.mockResolvedValue(mockActiveTenant);

    const req: any = { headers: { 'x-tenant-id': 'tenant-123' } };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(tenantsService.findById).toHaveBeenCalledWith('tenant-123');
    expect(req.tenantId).toBe('tenant-123');
    expect(req.tenant).toEqual(mockActiveTenant);
    expect(next).toHaveBeenCalled();
  });

  it('should reject request with ForbiddenException if tenant account is deactivated', async () => {
    tenantsService.findById.mockResolvedValue({
      ...mockActiveTenant,
      isActive: false,
    });

    const req: any = { headers: { 'x-tenant-id': 'tenant-123' } };
    const res: any = {};
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with UnauthorizedException if tenant ID is non-existent', async () => {
    tenantsService.findById.mockRejectedValue(new Error('Not found'));

    const req: any = { headers: { 'x-tenant-id': 'non-existent-id' } };
    const res: any = {};
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });
});
