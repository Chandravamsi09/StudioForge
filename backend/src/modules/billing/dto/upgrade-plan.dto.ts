import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanTier } from '../../../database/enums/plan-tier.enum';

export class UpgradePlanDto {
  @ApiProperty({ enum: PlanTier, example: PlanTier.PRO, description: 'Target subscription plan tier' })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;
}
