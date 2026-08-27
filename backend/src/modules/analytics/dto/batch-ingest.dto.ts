import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IngestEventDto } from './ingest-event.dto';

export class BatchIngestDto {
  @ApiProperty({ type: [IngestEventDto], description: 'Array of telemetry events to ingest (max 500 per batch)' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Batch must contain at least 1 telemetry event' })
  @ArrayMaxSize(500, { message: 'Batch size cannot exceed 500 events per request' })
  @ValidateNested({ each: true })
  @Type(() => IngestEventDto)
  events: IngestEventDto[];
}
