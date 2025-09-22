import { IsBase64, IsNotEmpty, IsString } from 'class-validator';

export class GenerateListingDto {
  @IsBase64()
  @IsNotEmpty()
  imageBase64: string;

  @IsString()
  @IsNotEmpty()
  userDescription: string;
}