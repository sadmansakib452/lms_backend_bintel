import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../../common/repository/permission/permission.repository';
import { CacheHelper } from '../../common/helper/cache.helper';
import { UserRepository } from '../../common/repository/user/user.repository';
import {
  CreatePermissionDto,
  PermissionsResponseDto,
  PermissionResponseDto,
} from './dto/permission.dto';

/**
 * Permission Service
 * Business logic for permission management
 * Handles permission operations and caching
 *
 * @class PermissionService
 */
@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly cacheHelper: CacheHelper,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Get all permissions from database
   * Used for admin panel and permission assignment
   * @param filters - Optional filters
   * @returns Promise<PermissionsResponseDto>
   *
   * @example
   * const perms = await permissionService.getAllPermissions();
   * const coursePerms = await permissionService.getAllPermissions({ subject: 'courses' });
   */
  async getAllPermissions(filters?: {
    subject?: string;
    action?: string;
  }): Promise<PermissionsResponseDto> {
    // Fetch all permissions (no caching for this - admin needs real-time data)
    const permissions = await this.permissionRepository.getAll(filters);

    // Group permissions by subject
    const grouped: { [key: string]: number } = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.subject]) {
        grouped[perm.subject] = 0;
      }
      grouped[perm.subject]++;
    });

    return {
      permissions: permissions as PermissionResponseDto[],
      total: permissions.length,
      grouped,
    };
  }

  /**
   * Create new permission
   * @param dto - Permission creation data
   * @returns Promise<PermissionResponseDto>
   *
   * @example
   * const permission = await permissionService.createPermission({
   *   action: 'moderate',
   *   subject: 'comments',
   *   title: 'Moderate Comments'
   * });
   */
  async createPermission(
    dto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.create(dto);
    return permission as PermissionResponseDto;
  }

  /**
   * Get permissions for a specific user
   * This is the CORE method used by PermissionGuard to check access
   *
   * CACHING STRATEGY:
   * - First check Redis cache with key: "permissions:user_id"
   * - If cache hit, return cached permissions
   * - If cache miss, query DB and cache for 300 seconds (5 minutes)
   *
   * @param userId - User ID to get permissions for
   * @returns Promise<Array<{ action: string; subject: string }>>
   *
   * @example
   * const userPerms = await permissionService.getUserPermissions('user_123');
   * // Returns: [
   * //   { action: 'create', subject: 'courses' },
   * //   { action: 'delete', subject: 'courses' },
   * //   { action: 'manage', subject: 'users' }
   * // ]
   */
  async getUserPermissions(
    userId: string,
  ): Promise<Array<{ action: string; subject: string }>> {
    const cacheKey = `permissions:${userId}`;

    // Step 1: Try to get from cache first (fast path)
    const cachedPermissions =
      await this.cacheHelper.get<Array<{ action: string; subject: string }>>(
        cacheKey,
      );
    if (cachedPermissions) {
      return cachedPermissions;
    }

    // Step 2: Cache miss - query database
    // Get all roles for this user
    const userRoles = await this.getUserRoles(userId);

    if (userRoles.length === 0) {
      // User has no roles, cache empty array
      await this.cacheHelper.set(cacheKey, [], 300);
      return [];
    }

    // Step 3: Get all permissions for these roles
    const permissionsSet = new Set<string>();
    const permissions: Array<{ action: string; subject: string }> = [];

    for (const role of userRoles) {
      const rolePermissions = await this.permissionRepository.getByRole(
        role.id,
      );
      rolePermissions.forEach((perm) => {
        const key = `${perm.action}:${perm.subject}`;
        if (!permissionsSet.has(key)) {
          permissionsSet.add(key);
          permissions.push({
            action: perm.action,
            subject: perm.subject,
          });
        }
      });
    }

    // Step 4: Cache the permissions for 5 minutes
    await this.cacheHelper.set(cacheKey, permissions, 300);

    return permissions;
  }

  /**
   * Get all user's roles (helper for getUserPermissions)
   * @param userId - User ID
   * @returns Promise<Role[]>
   *
   * @internal
   */
  private async getUserRoles(userId: string) {
    const user = await this.userRepository.getUserDetails(userId);
    return user?.role_users?.map((ru: any) => ru.role) || [];
  }

  /**
   * Invalidate permission cache for a specific user
   * Called when user's roles are changed
   * @param userId - User ID
   * @returns Promise<boolean>
   *
   * @example
   * // After assigning role to user:
   * await permissionService.invalidateUserPermissionCache('user_123');
   */
  async invalidateUserPermissionCache(userId: string): Promise<boolean> {
    const cacheKey = `permissions:${userId}`;
    return this.cacheHelper.delete(cacheKey);
  }

  /**
   * Invalidate all permission caches
   * Called when system-wide permission changes occur
   * Use with caution - affects all users
   * @returns Promise<number> - Number of keys deleted
   *
   * @example
   * // After creating new permission:
   * await permissionService.invalidateAllPermissionCaches();
   */
  async invalidateAllPermissionCaches(): Promise<number> {
    return this.cacheHelper.deleteByPattern('permissions:*');
  }

  /**
   * Check if user has specific permission
   * Convenience method used in services for permission validation
   * @param userId - User ID
   * @param action - Action name
   * @param subject - Subject name
   * @returns Promise<boolean>
   *
   * @example
   * const canDelete = await permissionService.hasPermission('user_123', 'delete', 'courses');
   * if (!canDelete) {
   *   throw new ForbiddenException('You cannot delete courses');
   * }
   */
  async hasPermission(
    userId: string,
    action: string,
    subject: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(
      (p) => p.action === action && p.subject === subject,
    );
  }

  /**
   * Get permission by ID
   * @param permissionId - Permission ID
   * @returns Promise<Permission | null>
   *
   * @example
   * const perm = await permissionService.getPermissionById('perm_123');
   */
  async getPermissionById(
    permissionId: string,
  ): Promise<PermissionResponseDto | null> {
    const permission = await this.permissionRepository.getById(permissionId);
    return permission as PermissionResponseDto | null;
  }

  /**
   * Get permissions by subject
   * Useful for filtering in admin panels
   * @param subject - Subject name
   * @returns Promise<PermissionResponseDto[]>
   *
   * @example
   * const coursePerms = await permissionService.getPermissionsBySubject('courses');
   */
  async getPermissionsBySubject(
    subject: string,
  ): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.getAll({ subject });
    return permissions as PermissionResponseDto[];
  }

  /**
   * Get all unique subjects in system
   * Used for filtering dropdowns in admin panel
   * @returns Promise<string[]>
   *
   * @example
   * const subjects = await permissionService.getUniqueSubjects();
   * // Returns: ['courses', 'users', 'roles', 'comments']
   */
  async getUniqueSubjects(): Promise<string[]> {
    return this.permissionRepository.getUniqueSubjects();
  }
}
