import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TelegramUser } from '../auth/strategies/telegram.strategy';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findByTelegramIdOrCreate(telegramUser: TelegramUser): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { telegramId: telegramUser.id },
    });

    if (existingUser) {
      // Опционально: обновить данные пользователя (имя, аватар) при каждом входе
      existingUser.name = `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim();
      existingUser.avatarUrl = telegramUser.photo_url || 'default_avatar_url'; // Укажите URL аватара по умолчанию
      return this.usersRepository.save(existingUser);
    }

    // Создаем нового пользователя
    const newUser = this.usersRepository.create({
      telegramId: telegramUser.id,
      name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
      avatarUrl: telegramUser.photo_url || 'default_avatar_url',
      // Здесь можно установить другие значения по умолчанию
      rating: 0,
      following: [],
      balance: 0,
      commissionOwed: 0,
    });

    return this.usersRepository.save(newUser);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }
}
