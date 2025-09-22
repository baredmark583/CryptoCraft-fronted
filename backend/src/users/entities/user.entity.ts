import { Entity, Column, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Order } from '../../orders/entities/order.entity';
import { DecimalTransformer } from '../../database/base.entity';

// Define jsonb types directly here as they are simple
export interface ShippingAddress {
  city: string;
  postOffice: string;
  recipientName: string;
  phoneNumber: string;
}

export interface BusinessInfo {
  registrationNumber: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({
    type: 'bigint',
    unique: true,
    nullable: true,
    transformer: {
      from: (val: string | null) => (val ? parseInt(val, 10) : null),
      to: (val: number | null) => val,
    },
  })
  telegramId?: number;

  @Column()
  name: string;

  @Column()
  avatarUrl: string;

  @Column({ nullable: true })
  headerImageUrl?: string;
  
  @Column('decimal', {
    precision: 2,
    scale: 1,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  rating: number;
  
  @Column('simple-array', { default: '' })
  following: string[];
  
  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  balance: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  commissionOwed: number;
  
  @Column({
    type: 'enum',
    enum: ['NONE', 'PRO'],
    default: 'NONE',
  })
  verificationLevel: 'NONE' | 'PRO';
  
  @Column({ nullable: true })
  affiliateId?: string;

  @Column({ nullable: true })
  phoneNumber?: string;
  
  @Column('jsonb', { nullable: true })
  defaultShippingAddress?: ShippingAddress;
  
  @Column('jsonb', { nullable: true })
  businessInfo?: BusinessInfo;
  
  @Column({ nullable: true, unique: true })
  tonWalletAddress?: string;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @OneToMany(() => Order, (order) => order.buyer)
  purchases: Order[];

  // FIX: Correct the inverse relation to point to the 'seller' property on the Order entity.
  @OneToMany(() => Order, (order) => order.seller)
  sales: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}