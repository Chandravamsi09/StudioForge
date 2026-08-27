import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TargetPlatform, BuildStatus } from '../../../database/enums/build.enum';

export class CreateBuildDto {
  @ApiProperty({ example: 'CyberArena: Legacy', description: 'Game project title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  gameTitle: string;

  @ApiProperty({ example: 'v1.4.0-rc2', description: 'Semantic version or build identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version: string;

  @ApiProperty({ enum: TargetPlatform, default: TargetPlatform.WINDOWS, description: 'Target platform' })
  @IsEnum(TargetPlatform)
  @IsNotEmpty()
  targetPlatform: TargetPlatform;

  @ApiPropertyOptional({ enum: BuildStatus, default: BuildStatus.QUEUED, description: 'Current status' })
  @IsEnum(BuildStatus)
  @IsOptional()
  status?: BuildStatus;

  @ApiPropertyOptional({ example: '9a8d4f3b', description: 'Git commit hash for traceability' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  commitHash?: string;

  @ApiPropertyOptional({ example: 'release/1.4', default: 'main', description: 'Git branch name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  branch?: string;

  @ApiPropertyOptional({ example: 'https://cdn.studioforge.dev/artifacts/build-1234.zip', description: 'Artifact URL' })
  @IsString()
  @IsOptional()
  artifactUrl?: string;

  @ApiPropertyOptional({ example: 524288000, description: 'Artifact size in bytes' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  artifactSizeBytes?: number;

  @ApiPropertyOptional({ example: 420, description: 'Build pipeline duration in seconds' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  buildDurationSeconds?: number;

  @ApiPropertyOptional({ example: 'Fixed multiplayer netcode desync on round reset', description: 'Build release notes' })
  @IsString()
  @IsOptional()
  changelog?: string;

  @ApiPropertyOptional({ example: { unityVersion: '6000.0.35f1', renderPipeline: 'URP' }, description: 'Engine/build metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
