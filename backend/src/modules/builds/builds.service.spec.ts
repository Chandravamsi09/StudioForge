import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { Build } from '../../database/entities/build.entity';
import { TargetPlatform, BuildStatus } from '../../database/enums/build.enum';

describe('BuildsService (Phase 2)', () => {
  let service: BuildsService;
  let repository: jest.Mocked<Repository<Build>>;

  const mockBuild: Build = {
    id: 'build-123',
    tenantId: 'tenant-123',
    tenant: null,
    gameTitle: 'CyberArena: Legacy',
    version: 'v1.4.0',
    targetPlatform: TargetPlatform.WINDOWS,
    status: BuildStatus.SUCCESS,
    commitHash: '9a8d4f3b',
    branch: 'release/1.4',
    artifactUrl: 'https://cdn.studioforge.dev/artifacts/build-123.zip',
    artifactSizeBytes: 524288000,
    buildDurationSeconds: 320,
    changelog: 'Added raytracing support',
    metadata: { engine: 'Unreal 5.4' },
    createdByUserId: 'user-123',
    createdByUser: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((build) => Promise.resolve({ id: 'build-123', ...build })),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(mockBuild),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildsService,
        {
          provide: getRepositoryToken(Build),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BuildsService>(BuildsService);
    repository = module.get(getRepositoryToken(Build));
  });

  describe('createBuild', () => {
    it('should create a build scoped to the tenant with defaults', async () => {
      const dto = {
        gameTitle: 'CyberArena: Legacy',
        version: 'v1.4.0',
        targetPlatform: TargetPlatform.WINDOWS,
      };

      const result = await service.createBuild('tenant-123', 'user-123', dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'tenant-123',
        createdByUserId: 'user-123',
        status: BuildStatus.QUEUED,
        branch: 'main',
      });
      expect(result.id).toBe('build-123');
      expect(result.gameTitle).toBe('CyberArena: Legacy');
    });
  });

  describe('findById', () => {
    it('should return the build when found within the same tenant', async () => {
      repository.findOne.mockResolvedValue(mockBuild);

      const result = await service.findById('tenant-123', 'build-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'build-123', tenantId: 'tenant-123' },
        relations: ['createdByUser'],
      });
      expect(result.id).toBe('build-123');
    });

    it('should throw NotFoundException if build does not exist or belongs to another tenant', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('other-tenant', 'build-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBuild', () => {
    it('should update build status and artifact details', async () => {
      repository.findOne.mockResolvedValue({ ...mockBuild });

      const updateDto = {
        status: BuildStatus.SUCCESS,
        artifactUrl: 'https://cdn.studioforge.dev/artifacts/build-123.zip',
        buildDurationSeconds: 400,
      };

      const result = await service.updateBuild('tenant-123', 'build-123', updateDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(result.artifactUrl).toBe('https://cdn.studioforge.dev/artifacts/build-123.zip');
    });
  });

  describe('deleteBuild', () => {
    it('should delete build and return confirmation', async () => {
      repository.findOne.mockResolvedValue(mockBuild);

      const result = await service.deleteBuild('tenant-123', 'build-123');

      expect(repository.remove).toHaveBeenCalledWith(mockBuild);
      expect(result.success).toBe(true);
      expect(result.message).toContain('v1.4.0');
    });
  });

  describe('getMetrics', () => {
    it('should compute build pipeline metrics and success rate', async () => {
      repository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // success
        .mockResolvedValueOnce(2)  // failed
        .mockResolvedValueOnce(1); // active

      const metrics = await service.getMetrics('tenant-123');

      expect(metrics.totalBuilds).toBe(10);
      expect(metrics.successBuilds).toBe(8);
      expect(metrics.failedBuilds).toBe(2);
      expect(metrics.successRate).toBe('80.0%');
    });
  });

  describe('findAll', () => {
    it('should query builds with pagination and filters', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBuild], 1]),
      };

      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('tenant-123', {
        gameTitle: 'CyberArena',
        targetPlatform: TargetPlatform.WINDOWS,
        status: BuildStatus.SUCCESS,
        page: 1,
        limit: 10,
      });

      expect(qb.where).toHaveBeenCalledWith('build.tenantId = :tenantId', { tenantId: 'tenant-123' });
      expect(qb.andWhere).toHaveBeenCalledWith('LOWER(build.gameTitle) LIKE LOWER(:gameTitle)', {
        gameTitle: '%CyberArena%',
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});
