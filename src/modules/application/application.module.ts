import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [NotificationModule, ContactModule, FaqModule],
})
export class ApplicationModule {}
