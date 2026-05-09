import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for banning a user
 * Used in POST /admin/user/:id/ban endpoint
 *
 * @class BanUserDto
 */
export class BanUserDto {
  @ApiProperty({
    description: 'Reason for banning the user',
    example: 'Violation of terms and conditions',
  })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString({ message: 'Reason must be a string' })
  reason: string;

  @ApiPropertyOptional({
    description: 'Send email notification to user',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'send_email must be a boolean' })
  send_email?: boolean = true;
}

/**
 * DTO for unbanning a user
 * Used in POST /admin/user/:id/unban endpoint
 *
 * @class UnbanUserDto
 */
export class UnbanUserDto {
  @ApiPropertyOptional({
    description: 'Reason for unbanning the user',
    example: 'Appeal accepted',
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Send email notification to user',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'send_email must be a boolean' })
  send_email?: boolean = true;
}