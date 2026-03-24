import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    exposedHeaders: [
      'payment-required',
      'x-payment-required',
      'x-payment',
      'www-authenticate',
    ],
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
