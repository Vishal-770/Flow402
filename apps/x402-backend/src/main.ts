import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Express } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Hardening
  app.use(helmet());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: [
      'payment-required',
      'x-payment-required',
      'x-payment',
      'www-authenticate',
    ],
  });

  // Global Configuration
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 4000;

  // Conditionally listen for local development
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    console.log(
      `[Flow402] Registry Backend live at http://localhost:${port}/api`,
    );
  }

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  return expressApp;
}

// For local direct execution
if (process.env.NODE_ENV !== 'production') {
  void bootstrap().catch((err) => {
    console.error('[Flow402] Fatal during bootstrap:', err);
    process.exit(1);
  });
}

// Export for Vercel serverless
export default bootstrap();
