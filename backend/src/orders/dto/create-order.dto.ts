import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, ValidateNested, IsNumber, IsString } from 'class-validator';
import { ShippingAddress } from '../../users/entities/user.entity';

class CartItemDto {
  @IsObject()
  product: { id: string, seller: { id: string } };

  @IsNumber()
  quantity: number;

  @IsNumber()
  priceAtTimeOfAddition: number;

  @IsOptional()
  @IsObject()
  variant?: any; 

  @IsEnum(['RETAIL', 'WHOLESALE'])
  purchaseType: 'RETAIL' | 'WHOLESALE';
}


export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cartItems: CartItemDto[];

  @IsEnum(['ESCROW', 'DIRECT'])
  paymentMethod: 'ESCROW' | 'DIRECT';

  @IsEnum(['NOVA_POSHTA', 'UKRPOSHTA'])
  shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA';
  
  @IsObject()
  shippingAddress: ShippingAddress;
  
  @IsString()
  @IsOptional()
  transactionHash?: string;
}
