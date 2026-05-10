import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto, UnbanUserDto } from './dto/ban-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import { PaginationHelper } from '../../../common/helper/pagination.helper';
import { MailService } from '../../../mail/mail.service';
import { PermissionService } from '../../permissions/permissions.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
    private mailService: MailService,
    private permissionService: PermissionService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.userRepository.createUser(createUserDto);

      if (user.success && user?.data?.id) {
        await this.prisma.user.update({
          where: { id: user.data.id },
          data: {
            email_verified_at: DateHelper.now(),
            approved_at: DateHelper.now(),
          },
        });
      }

      if (user.success) {
        return {
          success: user.success,
          message: user.message,
        };
      } else {
        return {
          success: user.success,
          message: user.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll({
    q,
    approved,
    page = 1,
    limit = 10,
    fields,
  }: {
    q?: string;
    approved?: string;
    page?: number;
    limit?: number;
    fields?: string;
  }) {
    try {
      // Fields that should never be exposed
      const blockedFields = ['password'];

      // Parse fields from query
      let select: any;
      if (!fields) {
        // No fields param: Return default safe fields + roles
        select = {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          role_users: {
            include: {
              role: {
                select: { id: true, name: true, title: true }
              }
            }
          }
        };
      } else if (fields === '*') {
        // fields=*: Return ALL fields except password + roles
        select = {
          id: true,
          name: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar: true,
          phone_number: true,
          country: true,
          state: true,
          city: true,
          address: true,
          zip_code: true,
          gender: true,
          date_of_birth: true,
          billing_id: true,
          type: true,
          status: true,
          availability: true,
          email_verified_at: true,
          is_two_factor_enabled: true,
          ban_reason: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          role_users: {
            include: {
              role: {
                select: { id: true, name: true, title: true }
              }
            }
          }
        };
      } else {
        // Parse user-provided fields (e.g., fields=id,name,email)
        const requestedFields = fields.split(',').map(f => f.trim().toLowerCase());

        // Validate and build select object
        select = {};
        for (const field of requestedFields) {
          if (blockedFields.includes(field)) {
            throw new Error(`Field '${field}' is not allowed`);
          }
          select[field] = true;
        }

        // Always include roles if not specified
        if (!requestedFields.includes('roles')) {
          (select as any).role_users = {
            include: {
              role: {
                select: { id: true, name: true, title: true }
              }
            }
          };
        }
      }

      const where_condition: any = {};
      if (q) {
        where_condition['OR'] = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (approved) {
        where_condition['approved_at'] =
          approved == 'active' ? { not: null } : { equals: null };
      }

      const result = await PaginationHelper.prismaOffsetPaginate({
        delegate: this.prisma.user,
        where: where_condition,
        select,
        orderBy: { created_at: 'desc' },
        page,
        limit,
        baseUrl: '/api/admin/user',
        query: { q, approved, fields },
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, fields?: string) {
    try {
      // Default select fields
      let select: any = {
        id: true,
        name: true,
        email: true,
        avatar: true,
        type: true,
        phone_number: true,
        status: true,
        approved_at: true,
        created_at: true,
        updated_at: true,
        billing_id: true,
        role_users: {
          include: {
            role: {
              select: { id: true, name: true, title: true }
            }
          }
        }
      };

      // Handle fields parameter
      if (fields === '*') {
        select = {
          id: true,
          name: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar: true,
          phone_number: true,
          country: true,
          state: true,
          city: true,
          address: true,
          zip_code: true,
          gender: true,
          date_of_birth: true,
          billing_id: true,
          type: true,
          status: true,
          availability: true,
          email_verified_at: true,
          is_two_factor_enabled: true,
          ban_reason: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          role_users: {
            include: {
              role: {
                select: { id: true, name: true, title: true }
              }
            }
          }
        };
      } else if (fields) {
        const requestedFields = fields.split(',').map(f => f.trim().toLowerCase());
        const blockedFields = ['password'];
        select = {};
        for (const field of requestedFields) {
          if (blockedFields.includes(field)) {
            throw new Error(`Field '${field}' is not allowed`);
          }
          select[field] = true;
        }
        if (!requestedFields.includes('roles')) {
          (select as any).role_users = {
            include: {
              role: {
                select: { id: true, name: true, title: true }
              }
            }
          };
        }
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        select,
      });

      // add avatar url to user
      if (user && (user as any).avatar) {
        (user as any)['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + (user as any).avatar,
        );
      }

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async approve(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      await this.prisma.user.update({
        where: { id: id },
        data: { approved_at: DateHelper.now() },
      });
      return {
        success: true,
        message: 'User approved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async reject(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      await this.prisma.user.update({
        where: { id: id },
        data: { approved_at: null },
      });
      return {
        success: true,
        message: 'User rejected successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Password hashing is handled in repository - pass as-is
      const user = await this.userRepository.updateUser(id, updateUserDto);

      // Invalidate permission cache if role changed
      if (updateUserDto.role_id) {
        await this.permissionService.invalidateUserPermissionCache(id);
      }

      if (user.success) {
        return {
          success: user.success,
          message: user.message,
        };
      } else {
        return {
          success: user.success,
          message: user.message,
        };
      }
    } catch (error: any) {
      // Handle unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        return {
          success: false,
          message: `The ${field} already exists`,
        };
      }
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const user = await this.userRepository.deleteUser(id);
      return user;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async ban(id: string, dto: BanUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, type: true },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Prevent banning super admin
      if (user.type === 'su_admin') {
        return { success: false, message: 'Cannot ban super admin' };
      }

      await this.userRepository.banUser(id, dto.reason);

      // Invalidate user permission cache
      await this.permissionService.invalidateUserPermissionCache(id);

      // Send email notification if enabled
      if (dto.send_email !== false && user.email && user.name) {
        await this.mailService.sendBanNotification({
          email: user.email,
          name: user.name,
          reason: dto.reason,
        });
      }

      return { success: true, message: 'User banned successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async unban(id: string, dto: UnbanUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      await this.userRepository.unbanUser(id);

      // Invalidate user permission cache
      await this.permissionService.invalidateUserPermissionCache(id);

      // Send email notification if enabled
      if (dto.send_email !== false && user.email && user.name) {
        await this.mailService.sendUnbanNotification({
          email: user.email,
          name: user.name,
          reason: dto.reason,
        });
      }

      return { success: true, message: 'User unbanned successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
