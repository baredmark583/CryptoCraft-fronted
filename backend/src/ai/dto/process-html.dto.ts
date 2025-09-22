import { IsString, IsNotEmpty } from 'class-validator';

export class ProcessHtmlDto {
  @IsString()
  @IsNotEmpty()
  html: string;
}