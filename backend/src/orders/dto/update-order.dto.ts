import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'COMPLETED', 'CANCELLED'])
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
