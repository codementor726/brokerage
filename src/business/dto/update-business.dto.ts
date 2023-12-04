import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import {
  OperationHoursDto,
  PropertyInformationDto,
  RecentImprovementsDto,
  ThirdPartyLinksDto,
} from './create-business.dto';

class Notes {
  @IsOptional()
  @IsString()
  creator: string;

  @IsNotEmpty({ message: 'please provide message of the note' })
  @IsString()
  message: string;
}

export class NotesDto {
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @Type(() => Notes)
  notes: NotesDto[];
}
export class UpdateBusinessDto {
  @IsNotEmpty()
  @IsString()
  slug: string;

  // images field starts
  @IsOptional()
  @IsString()
  dummyImage: string;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsArray()
  deletedImages: string[];

  @IsOptional()
  @IsArray()
  financialsAnalysis: string[];

  @IsOptional()
  @IsArray()
  deletedFinancialsAnalysis: string[];

  @IsOptional()
  @IsString()
  demographics: string[];

  @IsOptional()
  @IsArray()
  deletedDemographics: string[];

  @IsOptional()
  @IsString()
  financialsCSVImages: string[];

  @IsOptional()
  @IsArray()
  deletedFinancialsCSVImages: string[];
  // images field ends

  @IsOptional()
  @IsString()
  refId: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsArray()
  broker: string[];

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
  @IsNumber()
  totalEmployees: number;

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
  @IsString()
  googleMapAddress: string;

  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  latitude: number;

  // @IsOptional()
  // @Type(() => CurrentLocation)
  // location: CurrentLocation;

  @IsOptional()
  @IsArray()
  financialsCSV1: object;

  @IsOptional()
  @IsArray()
  financialsCSV2: object;

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
