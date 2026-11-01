import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  startsAt: string; // مثال: "2026-11-10T14:00:00Z"

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl()
  link?: string;
}