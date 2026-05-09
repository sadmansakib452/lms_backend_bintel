import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PermissionModule } from '../../permissions/permissions.module';
import { MailModule } from '../../../mail/mail.module';

@Module({
  imports: [PermissionModule, MailModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
