import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BuildsModule } from './modules/builds/builds.module';
import { QAModule } from './modules/qa/qa.module';

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
  ],
})
export class AppModule {}
