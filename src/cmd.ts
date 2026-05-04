// external imports
import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
// internal imports
import { PrismaService } from './prisma/prisma.service';
import { SeedCommand } from './command/seed.command';

@Module({
  providers: [SeedCommand, PrismaService],
})
export class AppModule {}

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
