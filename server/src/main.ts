import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

ConfigModule.forRoot();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.setGlobalPrefix('api');

  // Якщо FRONTEND_URL в .env містить кілька адрес через кому, наприклад:
  // FRONTEND_URL=http://localhost:3000,http://142.93.175.150
  const allowedOrigins = frontendUrl
    ? frontendUrl.split(',').map(origin => origin.trim())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Якщо запит без origin (наприклад, curl або same-origin), дозволяємо
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from the origin ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3210, '0.0.0.0');
}
bootstrap();
