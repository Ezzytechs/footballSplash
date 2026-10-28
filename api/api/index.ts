import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { NextFunction, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const server = express();
const allowedOrigins = [
  process.env.WEB_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5175',
].filter((origin): origin is string => Boolean(origin));

// Handle CORS preflight requests explicitly for Vercel serverless
server.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

let app: INestApplication | undefined;

async function bootstrap(): Promise<INestApplication> {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.setGlobalPrefix('api/v1');

    const swaggerConfig = new DocumentBuilder()
      .setTitle('SportNews API')
      .setDescription('Sports news, articles, teams, and match fixtures')
      .setVersion('1.0')
      .addTag('App', 'API availability and health checks')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  }

  return app;
}

export default async function handler(req: Request, res: Response) {
  await bootstrap();
  return server(req, res);
}