import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import _ from 'lodash';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  console.log(`PORT TO USE: ${process.env.PORT}`);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
