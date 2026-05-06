import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Role Repository
 * Handles all database operations related to Roles
 * This layer abstracts Prisma queries for role management
 *
 * @class RoleRepository
 */
@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all roles with optional pagination
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Promise<{ roles: Role[], total: number }>
   *
   * @example
   * const { roles, total } = await roleRepository.getAll(1, 10);
   */
  async getAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: limit,
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.role.count({ where: { deleted_at: null } }),
    ]);

    return { roles, total };
  }

  /**
   * Get single role by ID
   * @param roleId - Role ID
   * @returns Promise<Role | null>
   *
   * @example
   * const role = await roleRepository.getById('role_admin');
   */
  async getById(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
    });
  }

  /**
   * Get role by name
   * @param name - Role name (e.g., 'admin', 'teacher')
   * @returns Promise<Role | null>
   *
   * @example
   * const role = await roleRepository.getByName('admin');
   */
  async getByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name },
    });
  }

  /**
   * Get role with all its permissions
   * Joins with permission_roles and permissions tables
   * @param roleId - Role ID
   * @returns Promise<Role & { permissions: Permission[] } | null>
   *
   * @example
   * const roleWithPerms = await roleRepository.getRoleWithPermissions('role_admin');
   */
  async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permission_roles: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Create new role
   * @param data - Role data
   * @returns Promise<Role>
   *
   * @example
   * const role = await roleRepository.create({
   *   name: 'content_moderator',
   *   title: 'Content Moderator'
   * });
   */
  async create(data: { name: string; title?: string; description?: string }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        title: data.title || data.name,
        // description stored in permissions for CASL integration
      },
    });
  }

  /**
   * Update role details
   * @param roleId - Role ID to update
   * @param data - Updated role data
   * @returns Promise<Role>
   *
   * @example
   * const updated = await roleRepository.update('role_abc', {
   *   title: 'New Title'
   * });
   */
  async update(
    roleId: string,
    data: { name?: string; title?: string; description?: string },
  ) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        title: data.title,
      },
    });
  }

  /**
   * Soft delete role (sets deleted_at timestamp)
   * @param roleId - Role ID to delete
   * @returns Promise<Role>
   *
   * @example
   * const deleted = await roleRepository.softDelete('role_abc');
   */
  async softDelete(roleId: string) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Permanently delete role (hard delete)
   * Use with caution - also deletes related junction records via cascade
   * @param roleId - Role ID to delete
   * @returns Promise<Role>
   *
   * @example
   * const deleted = await roleRepository.hardDelete('role_abc');
   */
  async hardDelete(roleId: string) {
    return this.prisma.role.delete({
      where: { id: roleId },
    });
  }

  /**
   * Get number of users with this role
   * @param roleId - Role ID
   * @returns Promise<number>
   *
   * @example
   * const userCount = await roleRepository.getUserCount('role_admin');
   */
  async getUserCount(roleId: string): Promise<number> {
    return this.prisma.roleUser.count({
      where: { role_id: roleId },
    });
  }

  /**
   * Get number of permissions assigned to role
   * @param roleId - Role ID
   * @returns Promise<number>
   *
   * @example
   * const permCount = await roleRepository.getPermissionCount('role_admin');
   */
  async getPermissionCount(roleId: string): Promise<number> {
    return this.prisma.permissionRole.count({
      where: { role_id: roleId },
    });
  }

  /**
   * Assign permissions to role
   * Clears existing permissions and assigns new ones
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Promise<{ count: number }>
   *
   * @example
   * const result = await roleRepository.assignPermissions('role_abc', ['perm_1', 'perm_2']);
   */
  async assignPermissions(roleId: string, permissionIds: string[]) {
    // First, delete existing permissions for this role
    await this.prisma.permissionRole.deleteMany({
      where: { role_id: roleId },
    });

    // Then create new permission role links
    if (permissionIds.length > 0) {
      const permissionRoles = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      await this.prisma.permissionRole.createMany({
        data: permissionRoles,
      });
    }

    return { count: permissionIds.length };
  }

  /**
   * Remove specific permission from role
   * @param roleId - Role ID
   * @param permissionId - Permission ID to remove
   * @returns Promise<{ deleted: boolean }>
   *
   * @example
   * await roleRepository.removePermission('role_abc', 'perm_1');
   */
  async removePermission(roleId: string, permissionId: string) {
    const result = await this.prisma.permissionRole.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });

    return { deleted: result.count > 0 };
  }

  /**
   * Count total roles in system (excluding soft-deleted)
   * @returns Promise<number>
   *
   * @example
   * const total = await roleRepository.count();
   */
  async count(): Promise<number> {
    return this.prisma.role.count({
      where: { deleted_at: null },
    });
  }

  /**
   * Check if role exists by ID
   * @param roleId - Role ID
   * @returns Promise<boolean>
   *
   * @example
   * const exists = await roleRepository.exists('role_admin');
   */
  async exists(roleId: string): Promise<boolean> {
    const role = await this.getById(roleId);
    return !!role;
  }

  /**
   * Check if role name is unique (excluding itself)
   * Used for validation during create/update
   * @param name - Role name to check
   * @param excludeRoleId - Role ID to exclude from check (for updates)
   * @returns Promise<boolean>
   *
   * @example
   * const isUnique = await roleRepository.isNameUnique('new_role_name');
   * const isUnique = await roleRepository.isNameUnique('new_name', 'role_abc');
   */
  async isNameUnique(name: string, excludeRoleId?: string): Promise<boolean> {
    const existingRole = await this.prisma.role.findFirst({
      where: {
        name,
        NOT: excludeRoleId ? { id: excludeRoleId } : undefined,
      },
    });

    return !existingRole;
  }
}
