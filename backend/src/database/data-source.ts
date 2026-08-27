import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { Build } from './entities/build.entity';
import { Ticket } from './entities/ticket.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { LiveOpsEvent } from './entities/live-ops-event.entity';
import { Subscription } from './entities/subscription.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'studioforge',
  password: process.env.DB_PASSWORD || 'studioforge_secret_dev',
  database: process.env.DB_DATABASE || 'studioforge_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [Tenant, User, Build, Ticket, AnalyticsEvent, LiveOpsEvent, Subscription],
  migrations: ['src/database/migrations/*.ts'],
});
