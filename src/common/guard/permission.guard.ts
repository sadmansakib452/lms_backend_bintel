import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../modules/permissions/permissions.service';
import { REQUIRE_PERMISSION_KEY } from '../decorator/require-permission.decorator';

/**
 * Permission Guard
 * Checks if the authenticated user has the required permission for the route
 *
 * This guard should be used AFTER JwtAuthGuard in the @UseGuards chain
 * because it relies on req.user being set by JWT authentication
 *
 * @class PermissionGuard
 * @implements {CanActivate}
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Check if user has required permission
   * @param context - Execution context
   * @returns Promise<boolean> - True if access granted, throws ForbiddenException otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get permission requirements from route metadata
    const requiredPermission = this.reflector.get<{
      action: string;
      subject: string;
    }>(REQUIRE_PERMISSION_KEY, context.getHandler());

    // If no permission required, allow access
    if (!requiredPermission) {
      return true;
    }

    const { action, subject } = requiredPermission;

    // Get request and user
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userId = user?.id || user?.userId;

    if (!user || !userId) {
      this.logger.warn('PermissionGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Check if user has the required permission
      const hasPermission = await this.permissionService.hasPermission(
        userId,
        action,
        subject,
      );

      if (!hasPermission) {
        this.logger.warn(
          `PermissionGuard: User ${userId} denied access to ${action}:${subject}`,
        );
        throw new ForbiddenException(
          `You do not have permission to ${action} ${subject}`,
        );
      }

      this.logger.debug(
        `PermissionGuard: User ${userId} granted access to ${action}:${subject}`,
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `PermissionGuard: Error checking permissions for user ${userId}: ${(error as Error).message}`,
      );
      throw new ForbiddenException('Permission check failed');
    }
  }
}
