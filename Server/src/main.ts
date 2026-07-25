import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*', // or your frontend's dev URL
    // credentials: true, // if you're sending cookies/auth headers
  })
  await app.listen(process.env.PORT ?? 3000);
}

// main.ts

bootstrap();
