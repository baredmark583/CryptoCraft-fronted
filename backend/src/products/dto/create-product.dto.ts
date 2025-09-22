import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUrl, IsArray, IsObject, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { AuthenticationStatus, ProductVariant, VariantAttribute } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls: string[];

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsUUID()
  @IsNotEmpty()
  sellerId: string; // ID существующего пользователя

  @IsObject()
  dynamicAttributes: Record<string, string | number>;

  @IsArray()
  @IsOptional()
  variants?: ProductVariant[];

  @IsArray()
  @IsOptional()
  variantAttributes?: VariantAttribute[];

  @IsBoolean()
  @IsOptional()
  isPromoted?: boolean;
  
  @IsEnum(['ONE_OF_A_KIND', 'LIMITED_EDITION', 'MADE_TO_ORDER'])
  @IsOptional()
  uniqueness?: 'ONE_OF_A_KIND' | 'LIMITED_EDITION' | 'MADE_TO_ORDER';
  
  @IsEnum(['PHYSICAL', 'DIGITAL', 'SERVICE'])
  @IsOptional()
  productType?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  
  @IsUrl()
  @IsOptional()
  digitalFileUrl?: string;

  @IsBoolean()
  @IsOptional()
  giftWrapAvailable?: boolean;

  @IsNumber()
  @IsOptional()
  giftWrapPrice?: number;
  
  @IsNumber()
  @IsOptional()
  purchaseCost?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsBoolean()
  @IsOptional()
  isB2BEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  b2bMinQuantity?: number;

  @IsNumber()
  @IsOptional()
  b2bPrice?: number;

  @IsString()
  @IsOptional()
  turnaroundTime?: string;

  @IsEnum(['REMOTE', 'ON-SITE'])
  @IsOptional()
  serviceLocation?: 'REMOTE' | 'ON-SITE';

  @IsNumber()
  @IsOptional()
  warrantyDays?: number;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsBoolean()
  @IsOptional()
  isAuction?: boolean;

  @IsNumber()
  @IsOptional()
  auctionEnds?: number;
  
  @IsNumber()
  @IsOptional()
  startingBid?: number;

  @IsBoolean()
  @IsOptional()
  isAuthenticationAvailable?: boolean;

  @IsEnum(['NONE', 'PENDING', 'AUTHENTICATED', 'REJECTED'])
  @IsOptional()
  authenticationStatus?: AuthenticationStatus;

}