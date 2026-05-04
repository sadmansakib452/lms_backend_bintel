import { PartialType } from '@nestjs/swagger';
import { CreateWebsiteInfoDto } from './create-website-info.dto';

export class UpdateWebsiteInfoDto extends PartialType(CreateWebsiteInfoDto) {}
