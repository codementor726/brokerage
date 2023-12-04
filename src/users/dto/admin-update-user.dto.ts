import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  designation: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  meetingLink: string;

  @IsOptional()
  @IsBoolean()
  isCampaignAllowed: boolean;

  @IsOptional()
  @IsString()
  photo: string;

  @IsOptional()
  @IsString()
  mobilePhone: string;

  @IsOptional()
  @IsString()
  HomePhone: string;

  @IsOptional()
  @IsString()
  workPhone: string;
}
