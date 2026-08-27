import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from '../../database/entities/tenant.entity';
import { PlanTier } from '../../database/enums/plan-tier.enum';

describe('TenantsService (Phase 1)', () => {
  let service: TenantsService;
  let repository: jest.Mocked<Repository<Tenant>>;

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'CyberForge Interactive',
    slug: 'cyberforge-interactive',
    planTier: PlanTier.FREE,
    maxSeats: 5,
    isActive: true,
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((tenant) => Promise.resolve({ id: 'tenant-123', ...tenant })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    repository = module.get(getRepositoryToken(Tenant));
  });

  it('should create a new tenant with slug sanitized from name', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await service.createTenant('CyberForge Interactive');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { slug: 'cyberforge-interactive' } });
    expect(result.slug).toBe('cyberforge-interactive');
    expect(result.name).toBe('CyberForge Interactive');
  });

  it('should reject tenant creation if slug already exists', async () => {
    repository.findOne.mockResolvedValue(mockTenant);

    await expect(service.createTenant('CyberForge Interactive', 'cyberforge-interactive')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should retrieve tenant by id or throw NotFoundException if non-existent', async () => {
    repository.findOne.mockResolvedValueOnce(mockTenant).mockResolvedValueOnce(null);

    const found = await service.findById('tenant-123');
    expect(found.id).toBe('tenant-123');

    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
  });
});
