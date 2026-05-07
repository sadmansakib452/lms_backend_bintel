import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PermissionService } from './permissions.service';
import {
  CreatePermissionDto,
  PermissionResponseDto,
} from './dto/permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guard/permission.guard';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import appConfig from '../../config/app.config';
import { PaginationHelper } from '../../common/helper/pagination.helper';
import {
  OffsetPaginatedResponse,
  CursorPaginatedResponse,
} from '../../common/helper/pagination.types';
import { PrismaService } from '../../prisma/prisma.service';

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
  constructor(
    private readonly permissionService: PermissionService,
    private readonly prisma: PrismaService,
  ) {}

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
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description:
      'Pagination mode: "offset" (default) or "cursor". Use cursor for infinite scroll.',
    example: 'offset',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'Cursor value (permission id) for cursor pagination. Only used when type=cursor.',
    example: 'cmotx1hn50002egtuytswjkza',
  })
  async getAll(
    @Req() req: Request,
    @Query('subject') subject?: string,
    @Query('action') action?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('type') type: string = 'offset',
    @Query('cursor') cursor?: string,
  ): Promise<
    | OffsetPaginatedResponse<PermissionResponseDto>
    | CursorPaginatedResponse<PermissionResponseDto>
  > {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const normalizedType = type === 'cursor' ? 'cursor' : 'offset';
      const where: any = {};
      if (subject) where.subject = subject;
      if (action) where.action = action;

      const configuredBase = appConfig().app.url || '';
      const resolvedConfiguredBase = configuredBase.includes('${PORT}')
        ? configuredBase.replace('${PORT}', String(appConfig().app.port))
        : configuredBase;
      const baseUrl = resolvedConfiguredBase
        ? `${resolvedConfiguredBase}/api/admin/permissions`
        : `${req.protocol}://${req.get('host')}/api/admin/permissions`;

      if (normalizedType === 'cursor') {
        const rows = await this.prisma.permission.findMany({
          where,
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          take: limitNum + 1,
          ...(cursor
            ? {
                cursor: { id: cursor },
                skip: 1,
              }
            : {}),
        });

        const hasMore = rows.length > limitNum;
        const items = hasMore ? rows.slice(0, limitNum) : rows;
        const nextCursor =
          hasMore && items.length > 0 ? items[items.length - 1].id : undefined;

        return PaginationHelper.cursorPaginate<PermissionResponseDto>({
          items: items as PermissionResponseDto[],
          hasMore,
          nextCursor,
          limit: limitNum,
          baseUrl,
          query: { subject, action, type: 'cursor' },
        });
      }

      return await PaginationHelper.prismaOffsetPaginate<PermissionResponseDto>({
        delegate: this.prisma.permission,
        where,
        orderBy: { created_at: 'asc' },
        page: pageNum,
        limit: limitNum,
        baseUrl,
        query: { subject, action, type: 'offset' },
      });
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
