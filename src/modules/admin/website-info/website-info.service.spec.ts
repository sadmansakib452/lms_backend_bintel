import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteInfoService } from './website-info.service';

describe('WebsiteInfoService', () => {
  let service: WebsiteInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsiteInfoService],
    }).compile();

    service = module.get<WebsiteInfoService>(WebsiteInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
