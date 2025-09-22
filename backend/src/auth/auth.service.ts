import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TelegramUser } from './strategies/telegram.strategy';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly botToken: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!this.botToken) {
      throw new InternalServerErrorException('TELEGRAM_BOT_TOKEN is not configured in environment variables. Server cannot validate Telegram users.');
    }
  }

  async validateTelegramData(initData: string): Promise<User> {
    const data = new URLSearchParams(initData);
    const hash = data.get('hash');
    const user = JSON.parse(data.get('user'));

    if (!hash || !user) {
      throw new UnauthorizedException('Invalid Telegram data: hash or user is missing');
    }

    const dataToCheck: string[] = [];
    data.sort();
    data.forEach((val, key) => key !== 'hash' && dataToCheck.push(`${key}=${val}`));
    
    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();
      
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(dataToCheck.join('\n'))
      .digest('hex');

    if (hmac !== hash) {
      throw new UnauthorizedException('Invalid Telegram data: hash mismatch');
    }

    // Данные достоверны, ищем или создаем пользователя
    return this.usersService.findByTelegramIdOrCreate(user);
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.name };
    return {
      access_token: this.jwtService.sign(payload),
      user: user, // Возвращаем данные пользователя на фронтенд
    };
  }
}
