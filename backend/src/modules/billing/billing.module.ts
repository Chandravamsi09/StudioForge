import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Tenant]),
    UsersModule,
    TenantsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
