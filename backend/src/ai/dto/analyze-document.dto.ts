import { IsBase64, IsNotEmpty } from 'class-validator';

export class AnalyzeDocumentDto {
  @IsBase64()
  @IsNotEmpty()
  imageBase64: string;
}