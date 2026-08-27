import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { PlanTier } from '../../database/enums/plan-tier.enum';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createTenant(name: string, slug?: string, planTier: PlanTier = PlanTier.FREE, maxSeats: number = 5): Promise<Tenant> {
    const generatedSlug = slug || this.generateSlug(name);
    const existing = await this.tenantRepository.findOne({ where: { slug: generatedSlug } });

    if (existing) {
      throw new ConflictException(`Tenant with slug '${generatedSlug}' already exists`);
    }

    const tenant = this.tenantRepository.create({
      name,
      slug: generatedSlug,
      planTier,
      maxSeats,
      isActive: true,
    });

    return this.tenantRepository.save(tenant);
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
