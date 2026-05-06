import { Module } from '@nestjs/common';
import { RoleService } from './roles.service';
import { RoleController } from './roles.controller';
import { RoleRepository } from '../../common/repository/role/role.repository';
import { PermissionRepository } from '../../common/repository/permission/permission.repository';
import { PermissionService } from '../permissions/permissions.service';
import { PermissionGuard } from '../../common/guard/permission.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheHelper } from '../../common/helper/cache.helper';
import { PermissionModule } from '../permissions/permissions.module';

/**
 * Role Module
 * Feature module for role management
 *
 * Exports:
 * - RoleService: Used by admin controllers and auth services
 * - RoleRepository: Used for role data access
 *
 * Provides:
 * - RoleController: HTTP endpoints for role administration
 * - RoleService: Business logic for role CRUD and assignments
 * - RoleRepository: Data access layer
 * - PermissionService: Dependency for permission operations
 * - CacheHelper: Redis cache helper
 */
@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository, PermissionRepository, CacheHelper],
  exports: [RoleService, RoleRepository],
})
export class RoleModule {}
