import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto, UnbanUserDto } from './dto/ban-user.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorator/require-permission.decorator';
import { PermissionGuard } from '../../../common/guard/permission.guard';

@ApiBearerAuth()
@ApiTags('User')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({ description: 'Create a user' })
  @RequirePermission('create', 'users')
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return user;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiResponse({ description: 'Get all users' })
  @RequirePermission('read', 'users')
  @Get()
  async findAll(
    @Query() query: { q?: string; type?: string; approved?: string; page?: string; limit?: string },
  ) {
    try {
      const q = query.q;
      const type = query.type;
      const approved = query.approved;
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');

      const users = await this.userService.findAll({ q, type, approved, page, limit });
      return users;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Ban user
  @RequirePermission('delete', 'users')
  @ApiResponse({ description: 'Ban a user' })
  @Post(':id/ban')
  async ban(@Param('id') id: string, @Body() dto: BanUserDto) {
    try {
      const result = await this.userService.ban(id, dto);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Unban user
  @RequirePermission('update', 'users')
  @ApiResponse({ description: 'Unban a user' })
  @Post(':id/unban')
  async unban(@Param('id') id: string, @Body() dto: UnbanUserDto) {
    try {
      const result = await this.userService.unban(id, dto);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiResponse({ description: 'Get a user by id' })
  @RequirePermission('read', 'users')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.userService.findOne(id);
      return user;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @RequirePermission('update', 'users')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.update(id, updateUserDto);
      return user;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @RequirePermission('delete', 'users')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const user = await this.userService.remove(id);
      return user;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
