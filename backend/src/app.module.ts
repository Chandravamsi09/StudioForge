import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BuildsModule } from './modules/builds/builds.module';
import { QAModule } from './modules/qa/qa.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LiveOpsModule } from './modules/live-ops/live-ops.module';
import { BillingModule } from './modules/billing/billing.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    TenantsModule,
    UsersModule,
    AuthModule,
    BuildsModule,
    QAModule,
    AnalyticsModule,
    LiveOpsModule,
    BillingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
