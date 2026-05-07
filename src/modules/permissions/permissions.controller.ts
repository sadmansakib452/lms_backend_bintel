import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionService } from './permissions.service';
import {
  CreatePermissionDto,
  PermissionsResponseDto,
} from './dto/permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guard/permission.guard';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';

/**
 * Permission Controller
 * Handles permission-related HTTP endpoints
 * All endpoints require JWT authentication
 *
 * ENDPOINTS:
 * - GET /permissions - Get all permissions (system-wide)
 * - POST /permissions - Create new permission (admin only, see Chapter 4)
 */
@ApiTags('permissions')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * Get all permissions from system
   * Optionally filter by subject or action
   *
   * PUBLIC ENDPOINT (read-only):
   * - Returns all available permissions in system
   * - Used by admin panel for creating roles
   * - Pagination note: Returns all permissions (large datasets)
   *
   * @param subject - Optional filter by subject (e.g., 'courses')
   * @param action - Optional filter by action (e.g., 'create')
   * @returns PermissionsResponseDto
   *
   * @example
   * GET /permissions
   * Response: { permissions: [...], total: 42, grouped: { courses: 5, ... } }
   *
   * GET /permissions?subject=courses
   * Response: { permissions: [...], total: 5, grouped: { courses: 5 } }
   */
  @Get()
  @RequirePermission('read', 'permissions')
  @ApiOperation({
    summary: 'Get all permissions',
    description:
      'Retrieve all available permissions in the system with optional filtering',
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    description: 'Filter by subject (e.g., courses, users)',
    example: 'courses',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action (e.g., create, delete)',
    example: 'create',
  })
  async getAll(
    @Query('subject') subject?: string,
    @Query('action') action?: string,
  ): Promise<{ success: boolean; data: PermissionsResponseDto }> {
    try {
      const data = await this.permissionService.getAllPermissions({
        subject,
        action,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Create new permission
   * ADMIN ONLY - Will be protected by @RequirePermission decorator in Chapter 2
   *
   * Creates a new permission in the system
   * Can then be assigned to roles
   *
   * @param dto - Permission creation data
   * @returns Created permission
   *
   * @example
   * POST /permissions
   * Body: { action: 'moderate', subject: 'comments', title: 'Moderate Comments' }
   * Response: { success: true, data: { id: 'perm_123', ... } }
   */
  @Post()
  @RequirePermission('create', 'permissions')
  @ApiOperation({
    summary: 'Create new permission',
    description: 'Create a new permission in the system (admin only)',
  })
  async create(
    @Body() dto: CreatePermissionDto,
  ): Promise<{ success: boolean; data: any }> {
    try {
      // Validation: Check if permission already exists
      const exists = await this.permissionService
        .getPermissionsBySubject(dto.subject)
        .then((perms) => perms.some((p) => p.action === dto.action));

      if (exists) {
        throw new BadRequestException(
          `Permission with action "${dto.action}" and subject "${dto.subject}" already exists`,
        );
      }

      const data = await this.permissionService.createPermission(dto);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
