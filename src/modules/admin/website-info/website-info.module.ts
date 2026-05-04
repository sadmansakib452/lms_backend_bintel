import { Module } from '@nestjs/common';
import { WebsiteInfoService } from './website-info.service';
import { WebsiteInfoController } from './website-info.controller';

@Module({
  controllers: [WebsiteInfoController],
  providers: [WebsiteInfoService],
})
export class WebsiteInfoModule {}
