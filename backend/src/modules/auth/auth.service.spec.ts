import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../database/enums/role.enum';
import { PlanTier } from '../../database/enums/plan-tier.enum';
import { Tenant } from '../../database/entities/tenant.entity';
import { User } from '../../database/entities/user.entity';

describe('AuthService (Phase 1)', () => {
  let authService: AuthService;
  let tenantsService: jest.Mocked<TenantsService>;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockTenant: Tenant = {
    id: 'tenant-uuid-1',
    name: 'Mythic Realm Studios',
    slug: 'mythic-realm',
    planTier: PlanTier.FREE,
    maxSeats: 5,
    isActive: true,
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPasswordHash = '$2b$10$hashedPasswordSampleForTestingPurposes123456';

  const mockUser: User = {
    id: 'user-uuid-1',
    tenantId: 'tenant-uuid-1',
    tenant: mockTenant,
    email: 'admin@mythicrealm.com',
    passwordHash: mockPasswordHash,
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.OWNER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTenantsServiceFactory = {
      createTenant: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
    };

    const mockUsersServiceFactory = {
      createUser: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      countByTenantId: jest.fn(),
    };

    const mockJwtServiceFactory = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfigServiceFactory = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          'jwt.secret': 'test_jwt_secret',
          'jwt.expiresIn': '1d',
          'jwt.refreshSecret': 'test_refresh_secret',
          'jwt.refreshExpiresIn': '7d',
          'plans.freeMaxSeats': 5,
        };
        return configMap[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TenantsService, useValue: mockTenantsServiceFactory },
        { provide: UsersService, useValue: mockUsersServiceFactory },
        { provide: JwtService, useValue: mockJwtServiceFactory },
        { provide: ConfigService, useValue: mockConfigServiceFactory },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tenantsService = module.get(TenantsService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('Registration flow', () => {
    it('should successfully register a new studio tenant and OWNER user with JWT tokens', async () => {
      tenantsService.createTenant.mockResolvedValue(mockTenant);
      usersService.createUser.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');

      const registerDto = {
        organizationName: 'Mythic Realm Studios',
        organizationSlug: 'mythic-realm',
        email: 'admin@mythicrealm.com',
        password: 'SecureP@ssw0rd!2026',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const result = await authService.register(registerDto);

      expect(tenantsService.createTenant).toHaveBeenCalledWith(
        'Mythic Realm Studios',
        'mythic-realm',
        PlanTier.FREE,
        5,
      );
      expect(usersService.createUser).toHaveBeenCalledWith({
        tenantId: mockTenant.id,
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.OWNER,
      });
      expect(result.tokens.accessToken).toBe('mock_access_token');
      expect(result.tokens.refreshToken).toBe('mock_refresh_token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe(UserRole.OWNER);
      expect(result.user.tenantName).toBe(mockTenant.name);
    });

    it('should throw ConflictException if tenant creation fails due to duplicate slug', async () => {
      tenantsService.createTenant.mockRejectedValue(
        new ConflictException("Tenant with slug 'mythic-realm' already exists"),
      );

      const registerDto = {
        organizationName: 'Mythic Realm Studios',
        organizationSlug: 'mythic-realm',
        email: 'admin@mythicrealm.com',
        password: 'SecureP@ssw0rd!2026',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('Login flow', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async (pass: string, hash: string) => {
        return pass === 'ValidPassword123!';
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully login with valid credentials and return JWT tokens', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      tenantsService.findById.mockResolvedValue(mockTenant);
      jwtService.signAsync
        .mockResolvedValueOnce('valid_access_token')
        .mockResolvedValueOnce('valid_refresh_token');

      const loginDto = {
        email: 'admin@mythicrealm.com',
        password: 'ValidPassword123!',
      };

      const result = await authService.login(loginDto);

      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith('admin@mythicrealm.com', undefined);
      expect(result.tokens.accessToken).toBe('valid_access_token');
      expect(result.user.email).toBe('admin@mythicrealm.com');
    });

    it('should reject login when user is not found', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      const loginDto = {
        email: 'unknown@game.com',
        password: 'AnyPassword123!',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login when password does not match hash', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);

      const loginDto = {
        email: 'admin@mythicrealm.com',
        password: 'WrongPassword!',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login if the user account is deactivated', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const loginDto = {
        email: 'admin@mythicrealm.com',
        password: 'ValidPassword123!',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh Token flow', () => {
    it('should return new tokens when given a valid refresh token', async () => {
      const payload = {
        sub: 'user-uuid-1',
        email: 'admin@mythicrealm.com',
        tenantId: 'tenant-uuid-1',
        tenantSlug: 'mythic-realm',
        role: UserRole.OWNER,
        planTier: PlanTier.FREE,
      };

      jwtService.verifyAsync.mockResolvedValue(payload);
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await authService.refreshToken({ refreshToken: 'valid_refresh_token' });

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
    });

    it('should reject invalid or expired refresh tokens', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        authService.refreshToken({ refreshToken: 'expired_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Profile retrieval', () => {
    it('should return sanitized user profile with tenant details', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const profile = await authService.getProfile('user-uuid-1', 'tenant-uuid-1');

      expect(profile.id).toBe('user-uuid-1');
      expect(profile.email).toBe('admin@mythicrealm.com');
      expect(profile.tenant.name).toBe('Mythic Realm Studios');
      expect((profile as any).passwordHash).toBeUndefined();
    });
  });
});
