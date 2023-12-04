import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsNotEmpty({ message: 'Busines Id is required.' })
  @IsString()
  business: string;

  @IsNotEmpty({ message: 'Name is required.' })
  @IsString()
  contactName: string;

  @IsNotEmpty({ message: 'Contact is required.' })
  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  contactZip: string;

  @IsOptional()
  @IsString()
  ableToInvest: string;

  @IsOptional()
  @IsString()
  purchaseWithin: string;

  @IsOptional()
  @IsString()
  comments: string;

  @IsNotEmpty({ message: 'Headline is required.' })
  @IsString()
  headline: string;

  @IsNotEmpty({ message: 'Listing Id is required.' })
  @IsString()
  listingID: string;

  @IsOptional()
  @IsString()
  refID: string;
}
