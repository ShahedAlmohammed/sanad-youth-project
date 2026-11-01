import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsInt()
  programId?: number;
}