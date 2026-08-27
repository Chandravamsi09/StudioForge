import { UserRole } from '../../database/enums/role.enum';
import { PlanTier } from '../../database/enums/plan-tier.enum';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  tenantId: string;
  tenantSlug: string;
  role: UserRole;
  planTier: PlanTier;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    planTier: PlanTier;
  };
  tokens: AuthTokens;
}
