import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, User])], // Добавляем User, чтобы его репозиторий можно было инжектировать в ProductsService
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}