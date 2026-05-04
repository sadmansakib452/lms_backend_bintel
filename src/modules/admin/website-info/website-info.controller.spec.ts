import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteInfoController } from './website-info.controller';
import { WebsiteInfoService } from './website-info.service';

describe('WebsiteInfoController', () => {
  let controller: WebsiteInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteInfoController],
      providers: [WebsiteInfoService],
    }).compile();

    controller = module.get<WebsiteInfoController>(WebsiteInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
