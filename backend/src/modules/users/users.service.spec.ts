import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums/role.enum';

describe('UsersService (Phase 1)', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-456',
    tenantId: 'tenant-123',
    tenant: null,
    email: 'lead.dev@studio.com',
    passwordHash: '$2b$10$SampleHashForTestingPurposes',
    firstName: 'Alex',
    lastName: 'Rivers',
    role: UserRole.DEVELOPER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((user) => Promise.resolve({ id: 'user-456', ...user })),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should hash password with bcrypt and create user successfully', async () => {
    repository.findOne.mockResolvedValue(null);
    const hashSpy = jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2b$10$newHashedPasswordMock');

    const result = await service.createUser({
      tenantId: 'tenant-123',
      email: 'lead.dev@studio.com',
      password: 'DevPassword2026!',
      firstName: 'Alex',
      lastName: 'Rivers',
      role: UserRole.DEVELOPER,
    });

    expect(hashSpy).toHaveBeenCalledWith('DevPassword2026!', 10);
    expect(result.email).toBe('lead.dev@studio.com');
    expect(result.passwordHash).toBe('$2b$10$newHashedPasswordMock');
    expect(result.role).toBe(UserRole.DEVELOPER);

    hashSpy.mockRestore();
  });

  it('should throw ConflictException if user already exists within same tenant', async () => {
    repository.findOne.mockResolvedValue(mockUser);

    await expect(
      service.createUser({
        tenantId: 'tenant-123',
        email: 'lead.dev@studio.com',
        password: 'DevPassword2026!',
        firstName: 'Alex',
        lastName: 'Rivers',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
