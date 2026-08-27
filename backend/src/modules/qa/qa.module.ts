import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../../database/entities/ticket.entity';
import { QAService } from './qa.service';
import { QAController } from './qa.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [QAController],
  providers: [QAService],
  exports: [QAService],
})
export class QAModule {}
