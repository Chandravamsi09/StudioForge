import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../../database/enums/role.enum';
import { PlanTier } from '../../database/enums/plan-tier.enum';

describe('AuthController (Phase 1)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    user: {
      id: 'user-1',
      email: 'admin@studio.com',
      firstName: 'Game',
      lastName: 'Dev',
      role: UserRole.OWNER,
      tenantId: 'tenant-1',
      tenantName: 'Studio One',
      tenantSlug: 'studio-one',
      planTier: PlanTier.FREE,
    },
    tokens: {
      accessToken: 'sample_jwt_access_token',
      refreshToken: 'sample_jwt_refresh_token',
      expiresIn: '1d',
      tokenType: 'Bearer',
    },
  };

  beforeEach(async () => {
    const mockAuthServiceFactory = {
      register: jest.fn().mockResolvedValue(mockAuthResponse),
      login: jest.fn().mockResolvedValue(mockAuthResponse),
      refreshToken: jest.fn().mockResolvedValue(mockAuthResponse.tokens),
      getProfile: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'admin@studio.com',
        firstName: 'Game',
        lastName: 'Dev',
        role: UserRole.OWNER,
        isActive: true,
        tenant: {
          id: 'tenant-1',
          name: 'Studio One',
          slug: 'studio-one',
          planTier: PlanTier.FREE,
          maxSeats: 5,
        },
        createdAt: new Date(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthServiceFactory }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should call authService.register and return tokens on POST /auth/register', async () => {
    const dto = {
      organizationName: 'Studio One',
      email: 'admin@studio.com',
      password: 'SecurePassword123!',
      firstName: 'Game',
      lastName: 'Dev',
    };

    const result = await controller.register(dto);
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result.tokens.accessToken).toBe('sample_jwt_access_token');
    expect(result.user.email).toBe('admin@studio.com');
  });

  it('should call authService.login and return tokens on POST /auth/login', async () => {
    const dto = {
      email: 'admin@studio.com',
      password: 'SecurePassword123!',
    };

    const result = await controller.login(dto);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result.tokens.accessToken).toBe('sample_jwt_access_token');
  });

  it('should call authService.getProfile on GET /auth/me', async () => {
    const user = { id: 'user-1', tenantId: 'tenant-1' };
    const result = await controller.getProfile(user);
    expect(authService.getProfile).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(result.email).toBe('admin@studio.com');
  });
});
