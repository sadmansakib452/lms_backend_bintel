import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGateMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, res: any, next: () => void) {
    const user = req.user;
    if (user) {
      const roles = await this.prisma.role.findMany({
        include: {
          permissions: true,
        },
      });
      const permissionsArray = [];

      for (const role of roles) {
        for (const permissions of role.permissions) {
          permissionsArray.push({ [permissions.title]: role.id });
        }
      }
    }
    next();
  }
}
