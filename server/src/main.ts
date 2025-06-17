import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config(); // Альтернатива ConfigModule.forRoot()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const port = process.env.PORT ?? 3210;

  app.setGlobalPrefix('api');

  const allowedOrigins = frontendUrl
    ? frontendUrl.split(',').map(origin => origin.trim())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Дозволити curl/серверні запити

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on http://localhost:${port}`);
}
bootstrap();
