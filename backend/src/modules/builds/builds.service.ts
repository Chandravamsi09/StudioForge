import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Build } from '../../database/entities/build.entity';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildDto } from './dto/update-build.dto';
import { QueryBuildsDto } from './dto/query-builds.dto';
import { BuildStatus } from '../../database/enums/build.enum';

@Injectable()
export class BuildsService {
  constructor(
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,
  ) {}

  async createBuild(tenantId: string, userId: string, dto: CreateBuildDto): Promise<Build> {
    const build = this.buildRepository.create({
      ...dto,
      tenantId,
      createdByUserId: userId,
      status: dto.status || BuildStatus.QUEUED,
      branch: dto.branch || 'main',
    });

    return this.buildRepository.save(build);
  }

  async findAll(tenantId: string, query: QueryBuildsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.buildRepository
      .createQueryBuilder('build')
      .leftJoinAndSelect('build.createdByUser', 'user')
      .where('build.tenantId = :tenantId', { tenantId });

    if (query.gameTitle) {
      qb.andWhere('LOWER(build.gameTitle) LIKE LOWER(:gameTitle)', {
        gameTitle: `%${query.gameTitle}%`,
      });
    }

    if (query.targetPlatform) {
      qb.andWhere('build.targetPlatform = :platform', { platform: query.targetPlatform });
    }

    if (query.status) {
      qb.andWhere('build.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(build.version) LIKE LOWER(:search) OR LOWER(build.commitHash) LIKE LOWER(:search) OR LOWER(build.branch) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('build.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string): Promise<Build> {
    const build = await this.buildRepository.findOne({
      where: { id, tenantId },
      relations: ['createdByUser'],
    });

    if (!build) {
      throw new NotFoundException(`Build with ID '${id}' not found for this studio`);
    }

    return build;
  }

  async updateBuild(tenantId: string, id: string, dto: UpdateBuildDto): Promise<Build> {
    const build = await this.findById(tenantId, id);

    Object.assign(build, dto);
    return this.buildRepository.save(build);
  }

  async deleteBuild(tenantId: string, id: string): Promise<{ success: boolean; message: string }> {
    const build = await this.findById(tenantId, id);
    await this.buildRepository.remove(build);

    return {
      success: true,
      message: `Build '${build.version}' for '${build.gameTitle}' was successfully deleted`,
    };
  }

  async getMetrics(tenantId: string) {
    const totalBuilds = await this.buildRepository.count({ where: { tenantId } });
    const successBuilds = await this.buildRepository.count({
      where: { tenantId, status: BuildStatus.SUCCESS },
    });
    const failedBuilds = await this.buildRepository.count({
      where: { tenantId, status: BuildStatus.FAILED },
    });
    const activeBuilds = await this.buildRepository.count({
      where: { tenantId, status: BuildStatus.BUILDING },
    });

    const successRate = totalBuilds > 0 ? ((successBuilds / totalBuilds) * 100).toFixed(1) : '0';

    return {
      totalBuilds,
      successBuilds,
      failedBuilds,
      activeBuilds,
      successRate: `${successRate}%`,
    };
  }
}
