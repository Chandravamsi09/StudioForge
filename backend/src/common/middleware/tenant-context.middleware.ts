import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../modules/tenants/tenants.service';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
  tenant?: any;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    // Check for explicit tenant header (e.g. from API SDKs/telemetry clients)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    const headerTenantSlug = req.headers['x-tenant-slug'] as string;

    if (headerTenantSlug && !req.tenantSlug) {
      req.tenantSlug = headerTenantSlug;
    }

    if (headerTenantId) {
      try {
        const tenant = await this.tenantsService.findById(headerTenantId);
        if (!tenant.isActive) {
          throw new ForbiddenException('Tenant organization account is inactive');
        }
        req.tenantId = tenant.id;
        req.tenant = tenant;
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        throw new UnauthorizedException(`Invalid tenant ID: ${headerTenantId}`);
      }
    }

    next();
  }
}
