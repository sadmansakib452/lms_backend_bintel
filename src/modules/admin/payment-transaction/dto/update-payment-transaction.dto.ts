import { PartialType } from '@nestjs/swagger';
import { CreatePaymentTransactionDto } from './create-payment-transaction.dto';

export class UpdatePaymentTransactionDto extends PartialType(
  CreatePaymentTransactionDto,
) {}
