import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Express } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Hardening
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 4000;

  // Start the server if running locally
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    console.log(`[Flow402] Registry Backend live at http://localhost:${port}`);
  } else {
    // For serverless/Vercel environments
    await app.init();
  }

  return app.getHttpAdapter().getInstance() as Express;
}

// Ensure bootstrap is called exactly once
const server = bootstrap();

// Export the server instance for Vercel
export default server;
