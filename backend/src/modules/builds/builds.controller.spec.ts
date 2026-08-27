import { Test, TestingModule } from '@nestjs/testing';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { TargetPlatform, BuildStatus } from '../../database/enums/build.enum';

describe('BuildsController (Phase 2)', () => {
  let controller: BuildsController;
  let service: jest.Mocked<BuildsService>;

  const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
  const mockBuild = {
    id: 'build-1',
    tenantId: 'tenant-1',
    gameTitle: 'Galaxy Explorers',
    version: '1.0.0',
    targetPlatform: TargetPlatform.LINUX,
    status: BuildStatus.QUEUED,
    branch: 'main',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockBuildsServiceFactory = {
      createBuild: jest.fn().mockResolvedValue(mockBuild),
      findAll: jest.fn().mockResolvedValue({ items: [mockBuild], total: 1, page: 1, limit: 20, totalPages: 1 }),
      findById: jest.fn().mockResolvedValue(mockBuild),
      updateBuild: jest.fn().mockResolvedValue({ ...mockBuild, status: BuildStatus.SUCCESS }),
      deleteBuild: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      getMetrics: jest.fn().mockResolvedValue({ totalBuilds: 1, successBuilds: 1, failedBuilds: 0, activeBuilds: 0, successRate: '100%' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildsController],
      providers: [{ provide: BuildsService, useValue: mockBuildsServiceFactory }],
    }).compile();

    controller = module.get<BuildsController>(BuildsController);
    service = module.get(BuildsService);
  });

  it('should call service.createBuild on POST /builds', async () => {
    const dto = { gameTitle: 'Galaxy Explorers', version: '1.0.0', targetPlatform: TargetPlatform.LINUX };
    const result = await controller.createBuild(mockUser, dto);

    expect(service.createBuild).toHaveBeenCalledWith(mockUser.tenantId, mockUser.id, dto);
    expect(result.id).toBe('build-1');
  });

  it('should call service.findAll on GET /builds', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAll(mockUser, query);

    expect(service.findAll).toHaveBeenCalledWith(mockUser.tenantId, query);
    expect(result.items).toHaveLength(1);
  });

  it('should call service.findById on GET /builds/:id', async () => {
    const result = await controller.findById(mockUser, 'build-1');

    expect(service.findById).toHaveBeenCalledWith(mockUser.tenantId, 'build-1');
    expect(result.id).toBe('build-1');
  });

  it('should call service.updateBuild on PATCH /builds/:id', async () => {
    const dto = { status: BuildStatus.SUCCESS };
    const result = await controller.updateBuild(mockUser, 'build-1', dto);

    expect(service.updateBuild).toHaveBeenCalledWith(mockUser.tenantId, 'build-1', dto);
    expect(result.status).toBe(BuildStatus.SUCCESS);
  });

  it('should call service.deleteBuild on DELETE /builds/:id', async () => {
    const result = await controller.deleteBuild(mockUser, 'build-1');

    expect(service.deleteBuild).toHaveBeenCalledWith(mockUser.tenantId, 'build-1');
    expect(result.success).toBe(true);
  });

  it('should call service.getMetrics on GET /builds/metrics', async () => {
    const result = await controller.getMetrics(mockUser);

    expect(service.getMetrics).toHaveBeenCalledWith(mockUser.tenantId);
    expect(result.totalBuilds).toBe(1);
  });
});
