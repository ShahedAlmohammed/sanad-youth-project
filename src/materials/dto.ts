import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}