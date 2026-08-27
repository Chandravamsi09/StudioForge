import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload, AuthTokens, AuthResponse } from './interfaces/jwt-payload.interface';
import { UserRole } from '../../database/enums/role.enum';
import { PlanTier } from '../../database/enums/plan-tier.enum';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // 1. Create Organization / Tenant
    const tenant = await this.tenantsService.createTenant(
      dto.organizationName,
      dto.organizationSlug,
      PlanTier.FREE,
      this.configService.get<number>('plans.freeMaxSeats', 5),
    );

    // 2. Create Initial User with OWNER role
    const user = await this.usersService.createUser({
      tenantId: tenant.id,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.OWNER,
    });

    const tokens = await this.generateTokens(user, tenant.slug, tenant.planTier);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        planTier: tenant.planTier,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    let tenantId: string | undefined;

    if (dto.tenantSlug) {
      const tenant = await this.tenantsService.findBySlug(dto.tenantSlug);
      if (!tenant) {
        throw new UnauthorizedException('Invalid studio slug or credentials');
      }
      tenantId = tenant.id;
    }

    const user = await this.usersService.findByEmailWithPassword(dto.email, tenantId);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tenant = user.tenant || (await this.tenantsService.findById(user.tenantId));
    const tokens = await this.generateTokens(user, tenant.slug, tenant.planTier);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        planTier: tenant.planTier,
      },
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
      const payload: JwtPayload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.usersService.findById(payload.sub, payload.tenantId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User session is invalid');
      }

      return this.generateTokens(user, payload.tenantSlug, payload.planTier);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string, tenantId: string) {
    const user = await this.usersService.findById(userId, tenantId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        planTier: user.tenant.planTier,
        maxSeats: user.tenant.maxSeats,
      },
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(user: User, tenantSlug: string, planTier: PlanTier): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      tenantSlug,
      role: user.role,
      planTier,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn', '1d'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.expiresIn', '1d'),
      tokenType: 'Bearer',
    };
  }
}
