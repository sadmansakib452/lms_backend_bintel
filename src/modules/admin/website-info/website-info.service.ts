import { Injectable } from '@nestjs/common';
import { CreateWebsiteInfoDto } from './dto/create-website-info.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { StringHelper } from '../../../common/helper/string.helper';

@Injectable()
export class WebsiteInfoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createWebsiteInfoDto: CreateWebsiteInfoDto,
    files: {
      logo?: Express.Multer.File;
      favicon?: Express.Multer.File;
    },
  ) {
    try {
      const data: any = {};
      if (createWebsiteInfoDto.name) {
        data.name = createWebsiteInfoDto.name;
      }
      if (createWebsiteInfoDto.phone_number) {
        data.phone_number = createWebsiteInfoDto.phone_number;
      }
      // if (createWebsiteInfoDto.email) {
      //   data.email = createWebsiteInfoDto.email;
      // }
      if (createWebsiteInfoDto.address) {
        data.address = createWebsiteInfoDto.address;
      }
      if (createWebsiteInfoDto.copyright) {
        data.copyright = createWebsiteInfoDto.copyright;
      }
      if (createWebsiteInfoDto.cancellation_policy) {
        data.cancellation_policy = createWebsiteInfoDto.cancellation_policy;
      }
      if (files && files.logo) {
        // delete old logo from storage
        const logo = await this.prisma.websiteInfo.findFirst();
        if (logo) {
          await SojebStorage.delete(
            appConfig().storageUrl.websiteInfo + logo.logo,
          );
        }
        // upload file
        const fileName = `${StringHelper.randomString()}${files.logo.originalname}`;
        await SojebStorage.put(
          appConfig().storageUrl.websiteInfo + fileName,
          files.logo.buffer,
        );
        data.logo = fileName;
      }
      if (files && files.favicon) {
        // delete old favicon from storage
        const favicon = await this.prisma.websiteInfo.findFirst();
        if (favicon) {
          await SojebStorage.delete(
            appConfig().storageUrl.websiteInfo + favicon.favicon,
          );
        }
        // upload file
        const fileName = `${StringHelper.randomString()}${files.favicon.originalname}`;
        await SojebStorage.put(
          appConfig().storageUrl.websiteInfo + fileName,
          files.favicon.buffer,
        );

        data.favicon = fileName;
      }

      // check if website info already exists, then update it, otherwise create new
      const checkWebsiteInfo = await this.prisma.websiteInfo.findFirst();

      if (checkWebsiteInfo) {
        await this.prisma.websiteInfo.update({
          where: { id: checkWebsiteInfo.id },
          data: {
            ...data,
          },
        });
      } else {
        await this.prisma.websiteInfo.create({
          data: {
            ...data,
          },
        });
      }

      const websiteInfo = await this.prisma.websiteInfo.findFirst();

      if (files && files.logo) {
        await this.prisma.websiteInfo.update({
          where: { id: websiteInfo.id },
          data: { logo: files.logo[0].filename },
        });
      }

      if (files && files.favicon) {
        await this.prisma.websiteInfo.update({
          where: { id: websiteInfo.id },
          data: { favicon: files.favicon[0].filename },
        });
      }

      return {
        success: true,
        message: 'Website info updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll() {
    try {
      const websiteInfo = await this.prisma.websiteInfo.findFirst({
        select: {
          id: true,
          name: true,
          phone_number: true,
          email: true,
          address: true,
          logo: true,
          favicon: true,
          copyright: true,
          cancellation_policy: true,
        },
      });

      if (websiteInfo.logo) {
        websiteInfo['logo_url'] = SojebStorage.url(
          appConfig().storageUrl.websiteInfo + websiteInfo.logo,
        );
      }

      if (websiteInfo.favicon) {
        websiteInfo['favicon_url'] = SojebStorage.url(
          appConfig().storageUrl.websiteInfo + websiteInfo.favicon,
        );
      }

      return {
        success: true,
        data: websiteInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
