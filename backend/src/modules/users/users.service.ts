import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums/role.enum';

export interface CreateUserData {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existingUser = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
        tenantId: data.tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email '${normalizedEmail}' already exists in this tenant organization`,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, this.saltRounds);

    const user = this.userRepository.create({
      tenantId: data.tenantId,
      email: normalizedEmail,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: data.role || UserRole.DEVELOPER,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async findByEmailWithPassword(email: string, tenantId?: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const query = this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.email = :email', { email: normalizedEmail });

    if (tenantId) {
      query.andWhere('user.tenantId = :tenantId', { tenantId });
    }

    return query.getOne();
  }

  async findById(id: string, tenantId?: string): Promise<User> {
    const query: any = { id };
    if (tenantId) {
      query.tenantId = tenantId;
    }

    const user = await this.userRepository.findOne({
      where: query,
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async countByTenantId(tenantId: string): Promise<number> {
    return this.userRepository.count({ where: { tenantId } });
  }
}
