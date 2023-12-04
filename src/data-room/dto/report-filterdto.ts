import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class reportFilterDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  roles: string[];

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
