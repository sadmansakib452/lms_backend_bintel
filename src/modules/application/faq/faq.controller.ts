import { Controller, Get, Param } from '@nestjs/common';
import { FaqService } from './faq.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Faq')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @ApiOperation({ summary: 'Get all faq' })
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

  @ApiOperation({ summary: 'Get faq by id' })
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
}
