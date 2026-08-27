import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveOpsEvent } from '../../database/entities/live-ops-event.entity';
import { LiveOpsService } from './live-ops.service';
import { LiveOpsController } from './live-ops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LiveOpsEvent])],
  controllers: [LiveOpsController],
  providers: [LiveOpsService],
  exports: [LiveOpsService],
})
export class LiveOpsModule {}
