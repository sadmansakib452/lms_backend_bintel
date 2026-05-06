import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Permission Repository
 * Handles all database operations related to Permissions
 * This layer abstracts Prisma queries for permission management
 *
 * @class PermissionRepository
 */
@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all permissions from database
   * @param filters - Optional filters for subject or action
   * @returns Promise<Permission[]>
   *
   * @example
   * const allPermissions = await permissionRepository.getAll();
   * const coursePermissions = await permissionRepository.getAll({ subject: 'courses' });
   */
  async getAll(filters?: { subject?: string; action?: string }) {
    const where: any = {};
    if (filters?.subject) where.subject = filters.subject;
    if (filters?.action) where.action = filters.action;

    return this.prisma.permission.findMany({
      where,
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Get single permission by ID
   * @param permissionId - Permission ID
   * @returns Promise<Permission | null>
   *
   * @example
   * const permission = await permissionRepository.getById('perm_123');
   */
  async getById(permissionId: string) {
    return this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
  }

  /**
   * Get permission by action and subject combination
   * Useful for permission lookup without ID
   * @param action - Action name (e.g., 'create', 'delete')
   * @param subject - Subject name (e.g., 'courses', 'users')
   * @returns Promise<Permission | null>
   *
   * @example
   * const perm = await permissionRepository.getByActionSubject('delete', 'courses');
   */
  async getByActionSubject(action: string, subject: string) {
    return this.prisma.permission.findFirst({
      where: {
        action,
        subject,
      },
    });
  }

  /**
   * Create new permission
   * @param data - Permission data
   * @returns Promise<Permission>
   *
   * @example
   * const permission = await permissionRepository.create({
   *   action: 'moderate',
   *   subject: 'comments',
   *   title: 'Moderate Comments'
   * });
   */
  async create(data: {
    action: string;
    subject: string;
    title?: string;
    description?: string;
  }) {
    return this.prisma.permission.create({
      data: {
        action: data.action,
        subject: data.subject,
        title: data.title,
        // description stored as conditions for CASL integration in future
        conditions: data.description,
      },
    });
  }

  /**
   * Get permissions for a specific role
   * Joins through permission_roles junction table
   * @param roleId - Role ID
   * @returns Promise<Permission[]>
   *
   * @example
   * const rolePermissions = await permissionRepository.getByRole('role_admin');
   */
  async getByRole(roleId: string) {
    return this.prisma.permission.findMany({
      where: {
        permission_roles: {
          some: {
            role_id: roleId,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Get unique subjects from all permissions
   * Useful for permission grouping in admin UI
   * @returns Promise<string[]>
   *
   * @example
   * const subjects = await permissionRepository.getUniqueSubjects();
   * // Returns: ['courses', 'users', 'roles', 'comments']
   */
  async getUniqueSubjects(): Promise<string[]> {
    const results = await this.prisma.permission.findMany({
      distinct: ['subject'],
      select: { subject: true },
      where: { subject: { not: null } },
    });
    return results.map((r) => r.subject).filter(Boolean) as string[];
  }

  /**
   * Get permissions grouped by subject
   * Useful for organizing permissions in admin dashboard
   * @returns Promise<{ [subject: string]: Permission[] }>
   *
   * @example
   * const grouped = await permissionRepository.getGroupedBySubject();
   * // Returns: { courses: [...], users: [...], roles: [...] }
   */
  async getGroupedBySubject() {
    const permissions = await this.getAll();
    const grouped: { [key: string]: any[] } = {};

    permissions.forEach((permission) => {
      if (!grouped[permission.subject]) {
        grouped[permission.subject] = [];
      }
      grouped[permission.subject].push(permission);
    });

    return grouped;
  }

  /**
   * Count total permissions in system
   * @returns Promise<number>
   *
   * @example
   * const count = await permissionRepository.count();
   */
  async count(): Promise<number> {
    return this.prisma.permission.count();
  }

  /**
   * Check if permission exists by action and subject
   * @param action - Action name
   * @param subject - Subject name
   * @returns Promise<boolean>
   *
   * @example
   * const exists = await permissionRepository.exists('delete', 'courses');
   */
  async exists(action: string, subject: string): Promise<boolean> {
    const permission = await this.getByActionSubject(action, subject);
    return !!permission;
  }
}
