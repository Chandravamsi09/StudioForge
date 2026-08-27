import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../database/enums/role.enum';

describe('RolesGuard (Phase 7 - RBAC Permission Matrix)', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on route', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.VIEWER });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow OWNER to access routes requiring OWNER or ADMIN', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.OWNER });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow QA_ENGINEER to access routes requiring QA_ENGINEER or DEVELOPER', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.QA_ENGINEER, UserRole.DEVELOPER]);
    const context = createMockContext({ role: UserRole.QA_ENGINEER });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should reject VIEWER from mutating routes requiring DEVELOPER or ADMIN with ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.DEVELOPER, UserRole.ADMIN, UserRole.OWNER]);
    const context = createMockContext({ role: UserRole.VIEWER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject DEVELOPER from billing routes requiring OWNER with ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    const context = createMockContext({ role: UserRole.DEVELOPER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject unauthenticated request missing user or role with ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.DEVELOPER]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
