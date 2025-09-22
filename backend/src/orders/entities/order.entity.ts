import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, DecimalTransformer } from '../../database/base.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { ShippingAddress } from '../../users/entities/user.entity';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED';

@Entity('orders') // Explicitly name the table 'orders'
export class Order extends BaseEntity {
  @ManyToOne(() => User, (user) => user.purchases, { eager: true, onDelete: 'SET NULL', nullable: true })
  buyer: User;

  @ManyToOne(() => User, (user) => user.sales, { eager: true, onDelete: 'SET NULL', nullable: true })
  seller: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  total: number;

  @Column({
    type: 'enum',
    enum: [
      'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'COMPLETED', 'CANCELLED',
    ],
    default: 'PAID', // Assume payment is done before order creation
  })
  status: OrderStatus;

  @Column('bigint', { transformer: { from: (value: string) => parseInt(value, 10), to: (value: number) => value } })
  orderDate: number;

  @Column('jsonb')
  shippingAddress: ShippingAddress;

  @Column()
  shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA';
  
  @Column()
  paymentMethod: 'ESCROW' | 'DIRECT';

  @Column({ nullable: true })
  trackingNumber?: string;
  
  @Column({ nullable: true })
  transactionHash?: string;
}
