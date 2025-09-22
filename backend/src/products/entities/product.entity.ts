import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, DecimalTransformer } from '../../database/base.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

// Типы для jsonb полей, взяты из frontend/types.ts для справки
export interface VariantAttribute {
  name: string;
  options: string[];
}
export interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
}
export type AuthenticationStatus =
  | 'NONE'
  | 'PENDING'
  | 'AUTHENTICATED'
  | 'REJECTED';

@Entity()
export class Product extends BaseEntity {
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  price?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  salePrice?: number;

  @Column('simple-array')
  imageUrls: string[];

  @Column({ nullable: true })
  videoUrl?: string;

  @Column()
  category: string;

  @ManyToOne(() => User, (user) => user.products, {
    eager: true,
    onDelete: 'SET NULL', // If a user is deleted, set the seller to null
    nullable: true,
  })
  seller: User;

  @Column('jsonb', { default: {} })
  dynamicAttributes: Record<string, string | number>;

  @Column('jsonb', { nullable: true })
  variants?: ProductVariant[];

  @Column('jsonb', { nullable: true })
  variantAttributes?: VariantAttribute[];

  @Column({ default: false })
  isPromoted?: boolean;

  @Column({ nullable: true })
  uniqueness?: 'ONE_OF_A_KIND' | 'LIMITED_EDITION' | 'MADE_TO_ORDER';

  @Column({ nullable: true })
  productType?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';

  @Column({ nullable: true })
  digitalFileUrl?: string;

  @Column({ default: false })
  giftWrapAvailable?: boolean;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  giftWrapPrice?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  purchaseCost?: number;

  @Column({ nullable: true })
  weight?: number; // в граммах

  // B2B
  @Column({ default: false })
  isB2BEnabled?: boolean;

  @Column({ nullable: true })
  b2bMinQuantity?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  b2bPrice?: number;

  // Service
  @Column({ nullable: true })
  turnaroundTime?: string;

  @Column({ nullable: true })
  serviceLocation?: 'REMOTE' | 'ON-SITE';

  // Electronics
  @Column({ nullable: true })
  warrantyDays?: number;

  @Column({ nullable: true })
  serialNumber?: string;

  // Auction
  @Column({ default: false })
  isAuction?: boolean;

  @Column('bigint', { nullable: true })
  auctionEnds?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  startingBid?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  currentBid?: number;

  @Column('simple-array', { nullable: true })
  bidders?: string[];

  @Column({ nullable: true })
  winnerId?: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  finalPrice?: number;

  // Authentication
  @Column({ default: false })
  isAuthenticationAvailable?: boolean;

  @Column({
    type: 'enum',
    enum: ['NONE', 'PENDING', 'AUTHENTICATED', 'REJECTED'],
    default: 'NONE',
  })
  authenticationStatus?: AuthenticationStatus;

  @Column({ nullable: true })
  authenticationReportUrl?: string;

  @Column({ nullable: true })
  nftTokenId?: string;

  @Column({ nullable: true })
  nftContractAddress?: string;
  
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];
}