import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from '../../database/entities/build.entity';
import { BuildsService } from './builds.service';
import { BuildsController } from './builds.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Build])],
  controllers: [BuildsController],
  providers: [BuildsService],
  exports: [BuildsService],
})
export class BuildsModule {}
