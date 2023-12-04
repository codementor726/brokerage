import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateFolderDto {
  @IsOptional({ message: 'Folder name is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  business: string;

  @IsNotEmpty()
  @IsString()
  parent: string;

  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  fileName: string;

  @IsOptional()
  @IsBoolean()
  isFile: boolean;

  // @IsOptional()
  // @IsArray()
  // children: string[];

  @IsOptional()
  @IsArray()
  roles: string[];

  @IsOptional()
  @IsArray()
  allowedSellers: string[];

  @IsOptional()
  @IsArray()
  allowedBuyers: string[];

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
