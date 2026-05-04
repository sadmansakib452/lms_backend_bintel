import { Injectable } from '@nestjs/common';
import { BatchCreateFaqDto, CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async create(createFaqDto: CreateFaqDto) {
    try {
      const data: any = {};

      const question = createFaqDto.question;
      const answer = createFaqDto.answer;
      const sort_order = createFaqDto.sort_order;

      if (question) {
        data['question'] = question;
      }
      if (answer) {
        data['answer'] = answer;
      }
      if (sort_order) {
        data['sort_order'] = sort_order;
      }

      await this.prisma.faq.create({
        data: {
          ...data,
        },
      });

      return {
        success: true,
        message: 'Faq created successfully',
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
      const faqs = await this.prisma.faq.findMany({
        orderBy: {
          sort_order: 'asc',
        },
        select: {
          id: true,
          question: true,
          answer: true,
          sort_order: true,
        },
      });
      return {
        success: true,
        data: faqs,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
      const faq = await this.prisma.faq.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          question: true,
          answer: true,
          sort_order: true,
        },
      });
      return {
        success: true,
        data: faq,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async batchCreate(batchCreateFaqDto: BatchCreateFaqDto) {
    try {
      const faqs = batchCreateFaqDto.faqs;

      // old faq
      const oldFaqs = await this.prisma.faq.findMany();
      // delete old faqs that are not in the new faqs
      for (const oldFaq of oldFaqs) {
        if (!faqs.some((faq) => faq.id == oldFaq.id)) {
          await this.prisma.faq.delete({
            where: { id: oldFaq.id },
          });
        }
      }

      // create new faqs
      for (const faq of faqs) {
        const id = faq.id;
        const question = faq.question;
        const answer = faq.answer;
        const sort_order = faq.sort_order;

        const faqData: any = {};
        if (question) {
          faqData['question'] = question;
        }
        if (answer) {
          faqData['answer'] = answer;
        }
        if (sort_order) {
          faqData['sort_order'] = sort_order;
        }

        if (id) {
          await this.prisma.faq.update({
            where: {
              id: id,
            },
            data: {
              ...faqData,
              updated_at: DateHelper.now(),
            },
          });
        } else {
          // create new faq
          await this.prisma.faq.create({
            data: {
              ...faqData,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Faqs updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateFaqDto: UpdateFaqDto) {
    try {
      const data = {};
      if (updateFaqDto.question) {
        data['question'] = updateFaqDto.question;
      }
      await this.prisma.faq.update({
        where: {
          id: id,
        },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });
      return {
        success: true,
        message: 'Faq updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.faq.delete({
        where: {
          id: id,
        },
      });
      return {
        success: true,
        message: 'Faq deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
