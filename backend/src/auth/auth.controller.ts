import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async telegramLogin(@Body() telegramAuthDto: TelegramAuthDto) {
    const user = await this.authService.validateTelegramData(telegramAuthDto.initData);
    return this.authService.login(user);
  }
}
