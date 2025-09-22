import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // FIX: Add explicit type argument to `app.get` to ensure `configService` is correctly typed.
  const configService = app.get<ConfigService>(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  // Включаем глобальную валидацию для всех входящих данных
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Автоматически удалять свойства, которых нет в DTO
    transform: true, // Автоматически преобразовывать типы (например, string из запроса в number)
  }));

  // Включаем CORS для взаимодействия с фронтендом
  // FIX: Update CORS policy to allow requests from the Telegram wallet proxy in addition to the frontend origin. This is necessary for the TonConnect manifest to be fetched correctly.
  const allowedOrigins = ['https://walletbot.me'];
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }
  
  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  });
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);


  // FIX: `configService` is now correctly typed, so this generic call is valid.
  const port = configService.get<number>('PORT') || 3001;
  
  await app.listen(port);
  console.log(`Backend is running on port: ${port}`);
}
bootstrap();