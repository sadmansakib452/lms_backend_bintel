import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './roles.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionDto,
  RoleResponseDto,
  RoleWithPermissionsDto,
  RolesListResponseDto,
  AssignRoleDto,
  UserRolesResponseDto,
} from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import { PermissionGuard } from '../../common/guard/permission.guard';

/**
 * Role Controller
 * Handles role-related HTTP endpoints
 *
 * NOTE: All endpoints in this controller will be protected by @RequirePermission decorator in Chapter 2
 * For now, they're protected by JwtAuthGuard only (basic authentication)
 *
 * ENDPOINTS:
 * - GET /roles - List all roles
 * - POST /roles - Create role
 * - GET /roles/:id - Get role details
 * - PUT /roles/:id - Update role
 * - DELETE /roles/:id - Delete role
 * - POST /roles/:id/permissions - Assign permissions to role
 * - GET /users/:userId/roles - Get user's roles
 * - POST /users/:userId/roles - Assign role to user
 * - DELETE /users/:userId/roles/:roleId - Remove role from user
 */
@ApiTags('roles')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Get all roles with pagination
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns RolesListResponseDto
   */
  @Get()
  @RequirePermission('read', 'roles')
  @ApiOperation({
    summary: 'Get all roles',
    description: 'List all roles with pagination',
  })
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{ success: boolean; data: RolesListResponseDto }> {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

      const data = await this.roleService.getAllRoles(pageNum, limitNum);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Create new role
   * @param dto - Role creation data
   * @returns RoleResponseDto
   */
  @Post()
  @RequirePermission('create', 'roles')
  @ApiOperation({
    summary: 'Create new role',
    description: 'Create a new role in the system',
  })
  async create(
    @Body() dto: CreateRoleDto,
  ): Promise<{ success: boolean; data: RoleResponseDto }> {
    try {
      const data = await this.roleService.createRole(dto);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Get single role by ID with full details
   * @param roleId - Role ID
   * @returns RoleWithPermissionsDto
   */
  @Get(':roleId')
  @RequirePermission('read', 'roles')
  @ApiOperation({
    summary: 'Get role by ID',
    description:
      'Get detailed information about a specific role including its permissions',
  })
  async getById(
    @Param('roleId') roleId: string,
  ): Promise<{ success: boolean; data: RoleWithPermissionsDto }> {
    try {
      const data = await this.roleService.getRoleById(roleId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Update role details
   * @param roleId - Role ID
   * @param dto - Updated role data
   * @returns RoleResponseDto
   */
  @Put(':roleId')
  @RequirePermission('update', 'roles')
  @ApiOperation({
    summary: 'Update role',
    description: 'Update role title and description',
  })
  async update(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<{ success: boolean; data: RoleResponseDto }> {
    try {
      const data = await this.roleService.updateRole(roleId, dto);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Delete role (soft delete)
   * @param roleId - Role ID
   * @returns Success message
   */
  @Delete(':roleId')
  @RequirePermission('delete', 'roles')
  @ApiOperation({
    summary: 'Delete role',
    description: 'Soft delete a role (marks as deleted, no hard removal)',
  })
  async delete(
    @Param('roleId') roleId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.roleService.deleteRole(roleId);

      return {
        success: true,
        message: `Role ${roleId} deleted successfully`,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Assign permissions to role
   * @param roleId - Role ID
   * @param dto - Permission IDs to assign
   * @returns Updated role with permissions
   */
  @Post(':roleId/permissions')
  @RequirePermission('manage', 'roles')
  @ApiOperation({
    summary: 'Assign permissions to role',
    description: 'Assign one or more permissions to a role',
  })
  async assignPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
  ): Promise<{ success: boolean; data: RoleWithPermissionsDto }> {
    try {
      const data = await this.roleService.assignPermissionsToRole(
        roleId,
        dto.permission_ids,
      );

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Get user's roles
   * @param userId - User ID
   * @returns UserRolesResponseDto
   */
  @Get('users/:userId/roles')
  @RequirePermission('read', 'users')
  @ApiOperation({
    summary: 'Get user roles',
    description: 'Get all roles assigned to a specific user',
  })
  async getUserRoles(
    @Param('userId') userId: string,
  ): Promise<{ success: boolean; data: UserRolesResponseDto }> {
    try {
      const data = await this.roleService.getUserRoles(userId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Assign role to user
   * @param userId - User ID
   * @param dto - Role ID to assign
   * @returns User's updated roles
   */
  @Post('users/:userId/roles')
  @RequirePermission('manage', 'users')
  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Assign a role to a specific user',
  })
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ): Promise<{ success: boolean; data: UserRolesResponseDto }> {
    try {
      const data = await this.roleService.assignRoleToUser(userId, dto.role_id);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Remove role from user
   * @param userId - User ID
   * @param roleId - Role ID to remove
   * @returns Success message
   */
  @Delete('users/:userId/roles/:roleId')
  @RequirePermission('manage', 'users')
  @ApiOperation({
    summary: 'Remove role from user',
    description: 'Remove a role from a specific user',
  })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.roleService.removeRoleFromUser(userId, roleId);

      return {
        success: true,
        message: `Role ${roleId} removed from user ${userId}`,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
