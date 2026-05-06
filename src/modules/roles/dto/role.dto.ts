import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionResponseDto } from '../../permissions/dto/permission.dto';

/**
 * DTO for creating new role
 * Used in POST /admin/roles endpoint
 *
 * @class CreateRoleDto
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique role identifier (slug format)',
    example: 'content_moderator',
    type: 'string',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Human-readable role title',
    example: 'Content Moderator',
    type: 'string',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Can moderate and manage user content',
    type: 'string',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;
}

/**
 * DTO for updating role
 * Used in PUT /admin/roles/:roleId endpoint
 *
 * @class UpdateRoleDto
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Updated role title',
    example: 'Senior Content Moderator',
    type: 'string',
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated role description',
    example: 'Updated description',
    type: 'string',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;
}

/**
 * DTO for assigning permissions to role
 * Used in POST /admin/roles/:roleId/permissions endpoint
 *
 * @class AssignPermissionDto
 */
export class AssignPermissionDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to role',
    type: [String],
    example: ['perm_1', 'perm_2', 'perm_3'],
  })
  @IsArray({ message: 'Permission IDs must be an array' })
  @IsNotEmpty({ message: 'Permission IDs are required' })
  permission_ids: string[];
}

/**
 * DTO for role response
 * Returned from role endpoints
 *
 * @class RoleResponseDto
 */
export class RoleResponseDto {
  @ApiProperty({ example: 'role_123', description: 'Role ID' })
  id: string;

  @ApiProperty({
    example: 'content_moderator',
    description: 'Role name (slug)',
  })
  name: string;

  @ApiProperty({
    example: 'Content Moderator',
    description: 'Human-readable title',
  })
  title: string;

  @ApiProperty({ example: 5, description: 'Number of permissions assigned' })
  permissionCount: number;

  @ApiProperty({ example: 12, description: 'Number of users with this role' })
  userCount: number;

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
 * DTO for role with permissions details
 * Used in GET /admin/roles/:roleId response
 *
 * @class RoleWithPermissionsDto
 */
export class RoleWithPermissionsDto extends RoleResponseDto {
  @ApiProperty({
    description: 'Array of permissions assigned to this role',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];
}

/**
 * DTO for listing roles with pagination
 * Used in GET /admin/roles response
 *
 * @class RolesListResponseDto
 */
export class RolesListResponseDto {
  @ApiProperty({
    description: 'Array of roles',
    type: [RoleResponseDto],
  })
  roles: RoleResponseDto[];

  @ApiProperty({
    description: 'Pagination info',
    example: { page: 1, limit: 10, total: 5 },
    type: 'object',
    additionalProperties: false,
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      total: { type: 'number' },
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * DTO for assigning role to user
 * Used in POST /admin/users/:userId/roles endpoint
 *
 * @class AssignRoleDto
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'Role ID to assign to user',
    example: 'role_123',
    type: 'string',
  })
  @IsString({ message: 'Role ID must be a string' })
  @IsNotEmpty({ message: 'Role ID is required' })
  role_id: string;
}

/**
 * DTO for user's roles response
 * Used in GET /admin/users/:userId/roles response
 *
 * @class UserRolesResponseDto
 */
export class UserRolesResponseDto {
  @ApiProperty({ example: 'user_123', description: 'User ID' })
  userId: string;

  @ApiProperty({
    description: 'Array of roles assigned to user',
    type: [RoleResponseDto],
  })
  roles: RoleResponseDto[];
}
