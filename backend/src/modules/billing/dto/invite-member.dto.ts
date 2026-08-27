import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../database/enums/role.enum';

export class InviteMemberDto {
  @ApiProperty({ example: 'developer@studio.com', description: 'Email address of member to invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Alex', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Mercer', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'TemporaryPassword123!', description: 'Initial account password' })
  @IsString()
  @IsNotEmpty()
  temporaryPassword: string;
}
