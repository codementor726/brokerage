import { IsOptional, IsString } from 'class-validator';

export class UpdateContactInfo {
  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  contact: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  designation: string;
}
