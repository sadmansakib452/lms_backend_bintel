import { SetMetadata } from '@nestjs/common';

/**
 * Key for storing permission requirements in metadata
 */
export const REQUIRE_PERMISSION_KEY = 'requirePermission';

/**
 * Decorator to require specific permission for a route handler
 * Used in combination with PermissionGuard
 *
 * @param action - The action required (e.g., 'create', 'read', 'update', 'delete')
 * @param subject - The subject/resource (e.g., 'users', 'courses', 'roles')
 *
 * @example
 * @RequirePermission('create', 'courses')
 * @Post()
 * createCourse(@Body() dto: CreateCourseDto) {
 *   // Only users with 'create:courses' permission can access this
 * }
 *
 * @example
 * @RequirePermission('manage', 'users')
 * @Delete(':id')
 * deleteUser(@Param('id') id: string) {
 *   // Only users with 'manage:users' permission can access this
 * }
 */
export const RequirePermission = (action: string, subject: string) => {
  return SetMetadata(REQUIRE_PERMISSION_KEY, { action, subject });
};
