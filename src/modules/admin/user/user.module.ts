import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PermissionModule } from '../../permissions/permissions.module';

@Module({
  imports: [PermissionModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
