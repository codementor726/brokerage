import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ThirdPartyLinksDto {
  @IsNotEmpty({ message: 'Please provide key' })
  @IsString()
  key: string;

  @IsNotEmpty({ message: 'Please provide link' })
  @IsString()
  link: string;
}

export class OperationHoursDto {
  @IsNotEmpty({ message: 'Please provide days' })
  @IsString()
  days: string;

  @IsNotEmpty({ message: 'Please provide hours' })
  @IsString()
  hours: string;
}

export class RecentImprovementsDto {
  @IsNotEmpty({ message: 'Please provide year' })
  @IsNumber()
  year: Number;

  @IsNotEmpty({ message: 'Please provide features' })
  @IsArray()
  features: string[];
}

export class PropertyInformationDto {
  @IsNotEmpty({ message: 'Please provide title' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Please provide title' })
  @IsString()
  leaseInformation: string;

  @IsNotEmpty({ message: 'Please provide title' })
  @IsString()
  leaseRate: string;

  @IsNotEmpty({ message: 'Please provide description' })
  @IsString()
  description: string;
}

export class CreateBusinessDto {
  // images fields start
  @IsOptional()
  @IsString()
  dummyImage: string;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsArray()
  financialsAnalysis: string[];

  @IsOptional()
  @IsArray()
  demographics: string[];
  // images fields end

  @IsNotEmpty({ message: 'Please provide title' })
  @IsString()
  title: string;

  @IsOptional({ message: 'Please provide Ref Id' })
  @IsString()
  refId: string;

  @IsNotEmpty({ message: 'Please provide broker' })
  @IsArray()
  broker: string;

  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsNumber()
  order: number;

  @IsOptional({ message: 'Please provide inventory' })
  @IsNumber()
  inventory: number;

  @IsOptional({ message: 'Please provide cash flow' })
  @IsNumber()
  cashFlow: number;

  @IsOptional({ message: 'Please provide gross sales' })
  @IsNumber()
  grossSales: number;

  @IsNotEmpty({ message: 'Please provide category' })
  @IsString()
  category: string;

  @IsOptional({ message: 'Please provide industry' })
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

  @IsOptional({ message: 'Please provide demo description' })
  @IsString()
  dummyDescription: string;

  @IsOptional({ message: 'Please provide description' })
  @IsString()
  description: string;

  @IsOptional({ message: 'Please provide building sq fts.' })
  @IsString()
  buildingSF: string;

  @IsOptional({ message: 'Please provide monthly rent' })
  @IsNumber()
  monthlyRent: number;

  @IsOptional({ message: 'Please provide real estate' })
  @IsNumber()
  realEstate: number;

  @IsOptional()
  @IsNumber()
  partTimeEmployees: number;

  @IsOptional()
  @IsNumber()
  fullTimeEmployees: number;

  @IsOptional({ message: 'Please provide owner involvment' })
  @IsString()
  ownerInvolvment: string;

  @IsOptional({ message: 'Please provide reason' })
  @IsString()
  reason: string;

  @IsOptional({ message: 'Please provide business address' })
  @IsString()
  businessAddress: string;

  @IsOptional({ message: 'Please provide business opportunity' })
  @IsNumber()
  businessOpportunity: number;

  @IsOptional({ message: 'Please provide google map address' })
  @IsString()
  googleMapAddress: string;

  @IsOptional({ message: 'please provide longitude of the business.' })
  @IsNumber()
  longitude: number;

  @IsOptional({ message: 'please provide latitude of the business.' })
  @IsNumber()
  latitude: number;

  // @IsNotEmpty({ message: 'Please provide financials' })
  // @IsString()
  // financials: string;

  @IsOptional({ message: 'Please provide financials description' })
  @IsString()
  financialsDescription: string;

  @IsOptional({ message: 'Please provide business highlights' })
  @IsArray()
  businessHighlights: string[];

  @IsOptional({ message: 'Please provide third party links' })
  @Type(() => ThirdPartyLinksDto)
  thirdPartyPresence: ThirdPartyLinksDto[];

  @IsOptional({ message: 'Please provide pros' })
  @IsArray()
  pros: string[];

  @IsOptional({ message: 'Please provide cons' })
  @IsArray()
  cons: string[];

  @IsOptional({ message: 'Please provide property information' })
  @Type(() => PropertyInformationDto)
  propertyInformation: PropertyInformationDto;

  @IsOptional({ message: 'Please provide total hours of operation' })
  @Type(() => OperationHoursDto)
  hoursOfOperation: OperationHoursDto[];

  @IsOptional()
  @IsString()
  hoursOfOperationOpportunity: string;

  @IsOptional({ message: 'Please provide recent improvements' })
  @Type(() => RecentImprovementsDto)
  recentImprovements: RecentImprovementsDto[];

  @IsOptional({ message: 'Please provide financing options' })
  @IsArray()
  financingOptions: string[];

  @IsOptional({ message: 'Please provide company name' })
  @IsString()
  companyName: string;

  @IsOptional()
  @IsBoolean()
  autoNdaApprove: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;
}
