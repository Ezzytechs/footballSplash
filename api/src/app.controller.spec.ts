import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let testingModule: TestingModule;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue(1) };
    testingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = testingModule.get<AppController>(AppController);
  });

  it('returns the API status message from the home route', () => {
    expect(appController.getHome()).toBe('Live api working!!!');
  });

  it('reports database connectivity from the health route', async () => {
    await expect(appController.checkHealth()).resolves.toMatchObject({
      status: 'ok',
      database: 'connected',
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('includes the app routes in the Swagger document', async () => {
    const app = testingModule.createNestApplication();
    app.setGlobalPrefix('api/v1');

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test API').setVersion('1.0').build(),
    );

    expect(document.paths).toHaveProperty('/api/v1/home');
    expect(document.paths).toHaveProperty('/api/v1/health');

    await app.close();
  });
});
