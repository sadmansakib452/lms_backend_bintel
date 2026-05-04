import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { BatchCreateFaqDto, CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { RolesGuard } from '../../../common/guard/role/roles.guard';

@ApiBearerAuth()
@ApiTags('Faq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @ApiOperation({ summary: 'Create faq' })
  @Post()
  async create(@Body() createFaqDto: CreateFaqDto) {
    try {
      const faq = await this.faqService.create(createFaqDto);
      return faq;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Batch create or update faqs' })
  @Post('batch-create')
  async batchCreate(@Body() batchCreateFaqDto: BatchCreateFaqDto) {
    try {
      const faq = await this.faqService.batchCreate(batchCreateFaqDto);
      return faq;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Read all faqs' })
  @Get()
  async findAll() {
    try {
      const faqs = await this.faqService.findAll();
      return faqs;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Read one faq' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const faq = await this.faqService.findOne(id);
      return faq;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update faq' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    try {
      const faq = await this.faqService.update(id, updateFaqDto);
      return faq;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete faq' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const faq = await this.faqService.remove(id);
      return faq;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
