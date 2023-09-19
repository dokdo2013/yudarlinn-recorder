import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
// import { ClipperModule } from './clipper/clipper.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // cors
  app.enableCors();

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sampleRate: 1.0,
  });

  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('The NestJS API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(
    app,
    config,
    //   , {
    //   include: [ClipperModule],
    // }
  );
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
