import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class ThirdPartyLinksDto {
  @IsOptional()
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  link: string;
}

export class OperationHoursDto {
  @IsOptional()
  @IsString()
  days: string;

  @IsOptional()
  @IsString()
  hours: string;
}

export class RecentImprovementsDto {
  @IsOptional()
  @IsNumber()
  year: Number;

  @IsOptional()
  @IsArray()
  features: string[];
}

export class PropertyInformationDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class CreateDraftBusinessDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  refId: string;

  @IsOptional()
  @IsArray()
  broker: string;

  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsNumber()
  order: number;

  @IsOptional()
  @IsNumber()
  inventory: number;

  @IsOptional()
  @IsNumber()
  cashFlow: number;

  @IsOptional()
  @IsNumber()
  grossSales: number;

  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  industry: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  dummyDescription: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  buildingSF: string;

  @IsOptional()
  @IsNumber()
  monthlyRent: number;

  @IsOptional()
  @IsNumber()
  realEstate: number;

  @IsOptional()
  @IsNumber()
  partTimeEmployees: number;

  @IsOptional()
  @IsNumber()
  fullTimeEmployees: number;

  @IsOptional()
  @IsString()
  ownerInvolvment: string;

  @IsOptional()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  businessAddress: string;

  @IsOptional()
  @IsNumber()
  businessOpportunity: number;

  @IsOptional()
  @IsString()
  googleMapAddress: string;

  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsString()
  financialsDescription: string;

  @IsOptional()
  @IsArray()
  businessHighlights: string[];

  @IsOptional()
  @Type(() => ThirdPartyLinksDto)
  thirdPartyPresence: ThirdPartyLinksDto[];

  @IsOptional()
  @IsArray()
  pros: string[];

  @IsOptional()
  @IsArray()
  cons: string[];

  @IsOptional()
  @Type(() => PropertyInformationDto)
  propertyInformation: PropertyInformationDto;

  @IsOptional()
  @Type(() => OperationHoursDto)
  hoursOfOperation: OperationHoursDto[];

  @IsOptional()
  @IsString()
  hoursOfOperationOpportunity: string;

  @IsOptional()
  @Type(() => RecentImprovementsDto)
  recentImprovements: RecentImprovementsDto[];

  @IsOptional()
  @IsArray()
  financingOptions: string[];

  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsBoolean()
  autoNdaApprove: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;
}
