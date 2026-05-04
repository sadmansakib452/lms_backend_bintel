import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export interface IFaq {
  id?: string;
  question: string;
  answer: string;
  sort_order?: number;
}

export class CreateFaqDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'FAQ question',
    example: 'What is the price of the hotel?',
  })
  question: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'FAQ answer',
    example: 'The price of the hotel is 10000 BDT per night.',
  })
  answer: string;

  @ApiProperty({
    description: 'Sort order',
    example: 1,
  })
  sort_order?: number;
}

export class BatchCreateFaqDto {
  // batch create
  @ApiProperty({
    description: 'Faq data array',
    example: [
      {
        question: 'What is the price of the hotel?',
        answer: 'The price of the hotel is 10000 BDT per night.',
        sort_order: 1,
      },
    ],
  })
  faqs?: IFaq[];
}
