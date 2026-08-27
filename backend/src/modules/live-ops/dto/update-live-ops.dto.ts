import { PartialType } from '@nestjs/swagger';
import { CreateLiveOpsDto } from './create-live-ops.dto';

export class UpdateLiveOpsDto extends PartialType(CreateLiveOpsDto) {}
