import { IsBase64, IsNotEmpty, IsString, IsMimeType } from 'class-validator';

export class EditImageDto {
  @IsBase64()
  @IsNotEmpty()
  imageBase64: string;
  
  @IsMimeType()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}