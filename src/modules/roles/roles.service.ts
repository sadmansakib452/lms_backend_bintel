import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RoleRepository } from '../../common/repository/role/role.repository';
import { PermissionRepository } from '../../common/repository/permission/permission.repository';
import { PermissionService } from '../permissions/permissions.service';
import { CacheHelper } from '../../common/helper/cache.helper';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleWithPermissionsDto,
  RolesListResponseDto,
  UserRolesResponseDto,
} from './dto/role.dto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Role Service
 * Business logic for role management
 * Handles role creation, updating, permission assignment, and user role management
 *
 * @class RoleService
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionService: PermissionService,
    private readonly cacheHelper: CacheHelper,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all roles with pagination
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param search - Optional search term for role name/title
   * @returns Promise<RolesListResponseDto>
   *
   * @example
   * const roles = await roleService.getAllRoles(1, 10);
   */
  async getAllRoles(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<RolesListResponseDto> {
    const { roles, total } = await this.roleRepository.getAll(page, limit);

    // Enrich with user and permission counts
    const enrichedRoles = await Promise.all(
      roles.map(async (role) => ({
        id: role.id,
        name: role.name,
        title: role.title,
        permissionCount: await this.roleRepository.getPermissionCount(role.id),
        userCount: await this.roleRepository.getUserCount(role.id),
        created_at: role.created_at,
        updated_at: role.updated_at,
      })),
    );

    return {
      roles: enrichedRoles,
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single role by ID with full details
   * @param roleId - Role ID
   * @returns Promise<RoleWithPermissionsDto>
   * @throws NotFoundException - If role doesn't exist
   *
   * @example
   * const role = await roleService.getRoleById('role_admin');
   */
  async getRoleById(roleId: string): Promise<RoleWithPermissionsDto> {
    const role = await this.roleRepository.getRoleWithPermissions(roleId);

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const permissions = role.permission_roles?.map((pr: any) => ({
      id: pr.permission.id,
      action: pr.permission.action,
      subject: pr.permission.subject,
      title: pr.permission.title,
      created_at: pr.permission.created_at,
      updated_at: pr.permission.updated_at,
    }));

    return {
      id: role.id,
      name: role.name,
      title: role.title,
      permissionCount: permissions?.length || 0,
      userCount: await this.roleRepository.getUserCount(roleId),
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: permissions || [],
    };
  }

  /**
   * Create new role
   * @param dto - Role creation data
   * @returns Promise<RoleResponseDto>
   * @throws ConflictException - If role name already exists
   *
   * @example
   * const newRole = await roleService.createRole({
   *   name: 'content_moderator',
   *   title: 'Content Moderator'
   * });
   */
  async createRole(dto: CreateRoleDto): Promise<RoleResponseDto> {
    // Validate role name is unique
    const isUnique = await this.roleRepository.isNameUnique(dto.name);
    if (!isUnique) {
      throw new ConflictException(
        `Role with name "${dto.name}" already exists`,
      );
    }

    const role = await this.roleRepository.create(dto);

    // Invalidate all permission caches when new role is created
    // (because new role might be assigned to users later)
    await this.permissionService.invalidateAllPermissionCaches();

    return {
      id: role.id,
      name: role.name,
      title: role.title,
      permissionCount: 0,
      userCount: 0,
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }

  /**
   * Update role details
   * @param roleId - Role ID to update
   * @param dto - Updated role data
   * @returns Promise<RoleResponseDto>
   * @throws NotFoundException - If role doesn't exist
   * @throws ConflictException - If new name conflicts with another role
   *
   * @example
   * const updated = await roleService.updateRole('role_abc', {
   *   title: 'Senior Content Moderator'
   * });
   */
  async updateRole(
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    // Verify role exists
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const updated = await this.roleRepository.update(roleId, dto);

    // Invalidate permission caches for all users with this role
    const roleUsers = await this.prisma.roleUser.findMany({
      where: { role_id: roleId },
      select: { user_id: true },
    });

    for (const roleUser of roleUsers) {
      await this.permissionService.invalidateUserPermissionCache(
        roleUser.user_id,
      );
    }

    return {
      id: updated.id,
      name: updated.name,
      title: updated.title,
      permissionCount: await this.roleRepository.getPermissionCount(roleId),
      userCount: await this.roleRepository.getUserCount(roleId),
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Delete role (soft delete)
   * @param roleId - Role ID to delete
   * @returns Promise<{ success: boolean }>
   * @throws NotFoundException - If role doesn't exist
   *
   * @example
   * await roleService.deleteRole('role_old');
   */
  async deleteRole(roleId: string): Promise<{ success: boolean }> {
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    await this.roleRepository.softDelete(roleId);

    // Invalidate caches for users with this role
    const roleUsers = await this.prisma.roleUser.findMany({
      where: { role_id: roleId },
      select: { user_id: true },
    });

    for (const roleUser of roleUsers) {
      await this.permissionService.invalidateUserPermissionCache(
        roleUser.user_id,
      );
    }

    return { success: true };
  }

  /**
   * Assign permissions to role
   * Replaces existing permissions with new ones
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Promise<RoleWithPermissionsDto>
   * @throws NotFoundException - If role or permission doesn't exist
   *
   * @example
   * const updated = await roleService.assignPermissionsToRole('role_abc', [
   *   'perm_1',
   *   'perm_2'
   * ]);
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleWithPermissionsDto> {
    // Verify role exists
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify all permissions exist
    for (const permId of permissionIds) {
      const perm = await this.permissionRepository.getById(permId);
      if (!perm) {
        throw new NotFoundException(`Permission with ID ${permId} not found`);
      }
    }

    // Assign permissions to role
    await this.roleRepository.assignPermissions(roleId, permissionIds);

    // Invalidate caches for users with this role
    const roleUsers = await this.prisma.roleUser.findMany({
      where: { role_id: roleId },
      select: { user_id: true },
    });

    for (const roleUser of roleUsers) {
      await this.permissionService.invalidateUserPermissionCache(
        roleUser.user_id,
      );
    }

    // Return updated role with permissions
    return this.getRoleById(roleId);
  }

  /**
   * Assign role to user
   * @param userId - User ID
   * @param roleId - Role ID to assign
   * @returns Promise<UserRolesResponseDto>
   * @throws NotFoundException - If user or role doesn't exist
   *
   * @example
   * const userRoles = await roleService.assignRoleToUser('user_123', 'role_admin');
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
  ): Promise<UserRolesResponseDto> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify role exists
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Assign role to user (create RoleUser record if doesn't exist)
    await this.prisma.roleUser.upsert({
      where: {
        role_id_user_id: {
          role_id: roleId,
          user_id: userId,
        },
      },
      update: {},
      create: {
        role_id: roleId,
        user_id: userId,
      },
    });

    // Invalidate user's permission cache
    await this.permissionService.invalidateUserPermissionCache(userId);

    return this.getUserRoles(userId);
  }

  /**
   * Remove role from user
   * @param userId - User ID
   * @param roleId - Role ID to remove
   * @returns Promise<{ success: boolean }>
   * @throws NotFoundException - If relationship doesn't exist
   *
   * @example
   * await roleService.removeRoleFromUser('user_123', 'role_admin');
   */
  async removeRoleFromUser(
    userId: string,
    roleId: string,
  ): Promise<{ success: boolean }> {
    const result = await this.prisma.roleUser
      .delete({
        where: {
          role_id_user_id: {
            role_id: roleId,
            user_id: userId,
          },
        },
        select: { user_id: true },
      })
      .catch(() => null);

    if (!result) {
      throw new NotFoundException(
        `User ${userId} does not have role ${roleId}`,
      );
    }

    // Invalidate user's permission cache
    await this.permissionService.invalidateUserPermissionCache(result.user_id);

    return { success: true };
  }

  /**
   * Get all roles for a specific user
   * @param userId - User ID
   * @returns Promise<UserRolesResponseDto>
   *
   * @example
   * const userRoles = await roleService.getUserRoles('user_123');
   */
  async getUserRoles(userId: string): Promise<UserRolesResponseDto> {
    const roleUsers = await this.prisma.roleUser.findMany({
      where: { user_id: userId },
      include: { role: true },
    });

    const roles = await Promise.all(
      roleUsers.map(async (ru) => ({
        id: ru.role.id,
        name: ru.role.name,
        title: ru.role.title,
        permissionCount: await this.roleRepository.getPermissionCount(
          ru.role.id,
        ),
        userCount: await this.roleRepository.getUserCount(ru.role.id),
        created_at: ru.role.created_at,
        updated_at: ru.role.updated_at,
      })),
    );

    return {
      userId,
      roles,
    };
  }

  /**
   * Manually clear all role-related caches
   * Used for emergency cache invalidation
   * @returns Promise<number> - Number of cache keys cleared
   *
   * @example
   * await roleService.clearAllCaches();
   */
  async clearAllCaches(): Promise<number> {
    return this.permissionService.invalidateAllPermissionCaches();
  }
}
