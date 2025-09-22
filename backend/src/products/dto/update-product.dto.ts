import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Запрещаем изменять продавца при обновлении товара
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['sellerId'] as const),
) {}
