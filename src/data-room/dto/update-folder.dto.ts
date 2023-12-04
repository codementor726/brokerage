import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class UpdateFolderDto {
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
