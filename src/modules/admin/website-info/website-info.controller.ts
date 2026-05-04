import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  ParseFilePipe,
  UploadedFiles,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { WebsiteInfoService } from './website-info.service';
import { CreateWebsiteInfoDto } from './dto/create-website-info.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from '../../../common/guard/role/role.enum';

@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/website-info')
export class WebsiteInfoController {
  constructor(private readonly websiteInfoService: WebsiteInfoService) {}

  @ApiOperation({ summary: 'Update website info' })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  async create(
    @Req() req: Request,
    @Body() createWebsiteInfoDto: CreateWebsiteInfoDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
      }),
    )
    files: {
      logo?: Express.Multer.File;
      favicon?: Express.Multer.File;
    },
  ) {
    try {
      const websiteInfo = await this.websiteInfoService.create(
        createWebsiteInfoDto,
        files,
      );
      return websiteInfo;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get website info' })
  @Get()
  async findAll() {
    try {
      const websiteInfo = await this.websiteInfoService.findAll();
      return websiteInfo;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
