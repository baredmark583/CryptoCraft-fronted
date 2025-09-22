import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity, DecimalTransformer } from '../../database/base.entity';
import { Product } from '../../products/entities/product.entity';
import { Order } from './order.entity';
import { ProductVariant } from '../../products/entities/product.entity';

@Entity()
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { eager: true })
  product: Product;

  @Column()
  quantity: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  price: number; // Price per item at the time of purchase

  @Column('jsonb', { nullable: true })
  variant?: ProductVariant;

  @Column()
  purchaseType: 'RETAIL' | 'WHOLESALE';
}
