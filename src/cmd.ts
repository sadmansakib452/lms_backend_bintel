import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { RepositoryModule } from './common/repository/repository.module';
import { SeedCommand } from './command/seed.command';

// Seed-only module: avoid booting full `AppModule` (which initializes gateways).
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    RepositoryModule,
  ],
  providers: [SeedCommand],
})
export class SeedAppModule {}

async function bootstrap() {
  await CommandFactory.run(SeedAppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });
}

bootstrap();