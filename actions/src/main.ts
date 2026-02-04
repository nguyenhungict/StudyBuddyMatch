import 'dotenv/config';
import mongoose from 'mongoose';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

// Static uploads
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

// Filters / Pipes
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {

  // ===============================
  // 🔹 MONGODB (CHAT)
  // ===============================
  if (!process.env.MONGO_URI) {
    throw new Error('❌ MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected (Chat)');

  // ===============================
  // 🔹 NEST APP
  // ===============================
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ===============================
  // 🔹 GLOBAL PREFIX
  // ===============================
  app.setGlobalPrefix('api');

  // ===============================
  // 🔹 BODY SIZE (UPLOAD)
  // ===============================
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // ===============================
  // 🔹 CORS
  // ===============================
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:8888'],
    credentials: true,
  });

  // ===============================
  // 🔹 GLOBAL VALIDATION
  // ===============================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ===============================
  // 🔹 STATIC UPLOADS (CHAT + PROJECT)
  // http://localhost:8888/uploads/xxx.png
  // ===============================
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // ===============================
  // 🔹 SWAGGER
  // ===============================
  const config = new DocumentBuilder()
    .setTitle('Staff APIs')
    .setDescription(`
      - Authentication: Bearer token
      - Pagination: /endpoint?take=50&page=2
      - Filter: ?filters={}
    `)
    .setVersion('0.1')
    .addBearerAuth({
      name: 'authorization',
      in: 'header',
      description: 'Authentication token',
      type: 'apiKey',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ===============================
  // 🔹 START SERVER
  // ===============================
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8888;

  await app.listen(port);

  console.log(`🚀 Application running at http://localhost:${port}`);
  console.log(`📄 Swagger Docs: http://localhost:${port}/docs`);
}

bootstrap();
