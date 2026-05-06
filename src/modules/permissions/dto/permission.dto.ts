import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating new permission
 * Used in POST /admin/permissions endpoint
 *
 * @class CreatePermissionDto
 */
export class CreatePermissionDto {
  @ApiProperty({
    description: 'Action name (e.g., create, read, update, delete, manage)',
    example: 'moderate',
    type: 'string',
  })
  @IsString({ message: 'Action must be a string' })
  @IsNotEmpty({ message: 'Action is required' })
  @MinLength(2, { message: 'Action must be at least 2 characters' })
  @MaxLength(50, { message: 'Action must not exceed 50 characters' })
  action: string;

  @ApiProperty({
    description: 'Subject/Resource name (e.g., courses, users, comments)',
    example: 'comments',
    type: 'string',
  })
  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  @MinLength(2, { message: 'Subject must be at least 2 characters' })
  @MaxLength(50, { message: 'Subject must not exceed 50 characters' })
  subject: string;

  @ApiPropertyOptional({
    description: 'Human-readable title for the permission',
    example: 'Moderate Comments',
    type: 'string',
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of what this permission allows',
    example: 'Can moderate user-submitted comments',
    type: 'string',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;
}

/**
 * DTO for permission response
 * Returned from GET endpoints
 *
 * @class PermissionResponseDto
 */
export class PermissionResponseDto {
  @ApiProperty({ example: 'perm_123', description: 'Permission ID' })
  id: string;

  @ApiProperty({ example: 'moderate', description: 'Action name' })
  action: string;

  @ApiProperty({ example: 'comments', description: 'Subject name' })
  subject: string;

  @ApiProperty({
    example: 'Moderate Comments',
    description: 'Human-readable title',
  })
  title: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;
}

/**
 * DTO for listing permissions with grouping
 * Used in GET /auth/permissions response
 *
 * @class PermissionsResponseDto
 */
export class PermissionsResponseDto {
  @ApiProperty({
    description: 'List of all available permissions',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];

  @ApiProperty({
    description: 'Total number of permissions',
    example: 42,
    type: 'number',
  })
  total: number;

  @ApiProperty({
    description: 'Permissions grouped by subject with count',
    example: { courses: 5, users: 4, roles: 3, comments: 2 },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  grouped: { [subject: string]: number };
}
