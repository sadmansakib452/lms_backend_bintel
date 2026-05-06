import { Module } from '@nestjs/common';
import { PermissionService } from './permissions.service';
import { PermissionController } from './permissions.controller';
import { PermissionRepository } from '../../common/repository/permission/permission.repository';
import { CacheHelper } from '../../common/helper/cache.helper';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionGuard } from '../../common/guard/permission.guard';

/**
 * Permission Module
 * Feature module for permission management
 *
 * Exports:
 * - PermissionService: Core service for permission operations
 *
 * Provides:
 * - PermissionService: Used by PermissionGuard, RoleService, AuthService
 * - PermissionRepository: Data access layer
 * - CacheHelper: Redis caching layer
 *
 * @module PermissionModule
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PermissionService,
    PermissionRepository,
    CacheHelper,
    PermissionGuard,
  ],
  controllers: [PermissionController],
  exports: [PermissionService, PermissionRepository, PermissionGuard],
})
export class PermissionModule {}
