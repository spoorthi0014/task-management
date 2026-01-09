import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@task-management/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({
      user: { sub: '1', role: Role.VIEWER },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow Owner to access admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({
      user: { sub: '1', role: Role.OWNER, email: 'owner@test.com', organizationId: '1' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow Admin to access admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({
      user: { sub: '1', role: Role.ADMIN, email: 'admin@test.com', organizationId: '1' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny Viewer access to admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({
      user: { sub: '1', role: Role.VIEWER, email: 'viewer@test.com', organizationId: '1' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

    const context = createMockExecutionContext({
      user: undefined,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow Owner to access owner-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

    const context = createMockExecutionContext({
      user: { sub: '1', role: Role.OWNER, email: 'owner@test.com', organizationId: '1' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny Admin access to owner-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

    const context = createMockExecutionContext({
      user: { sub: '1', role: Role.ADMIN, email: 'admin@test.com', organizationId: '1' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

function createMockExecutionContext(request: { user?: unknown }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}
