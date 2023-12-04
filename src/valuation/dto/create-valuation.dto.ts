import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateValuationDto {
  @IsNotEmpty({ message: 'Please provide email' })
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'Please provide first name' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Please provide last name' })
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  spouseName: string;

  @IsNotEmpty({ message: 'Please provide street address' })
  @IsString()
  streetAddress: string;

  @IsOptional()
  @IsString()
  streetAddress2: string;

  @IsNotEmpty({ message: 'Please provide city' })
  @IsString()
  city: string;

  @IsNotEmpty({ message: 'Please provide state' })
  @IsString()
  state: string;

  @IsNotEmpty({ message: 'Please provide postal code' })
  @IsString()
  postalCode: string;

  @IsNotEmpty({ message: 'Please provide contact no.' })
  @IsString()
  contact: string;

  @IsNotEmpty({ message: 'Please provide Current Occupation/Business' })
  @IsString()
  currentBusiness: string;

  @IsNotEmpty({ message: 'Please provide Planning to relocate choice' })
  @IsBoolean()
  planningToRelocate: boolean;

  @IsNotEmpty({ message: 'Please provide any owned business before' })
  @IsString()
  ownedBusiness: string;

  @IsNotEmpty({
    message: 'Please provide any business you have been looking for',
  })
  @IsString()
  lookingForBusiness: string;

  @IsNotEmpty({ message: 'Please provide plan purchasing business' })
  @IsString()
  planPurchasingBusiness: string;

  @IsNotEmpty({ message: 'Please provide business assistance.' })
  @IsString()
  businessAssistance: string;

  @IsNotEmpty({ message: 'Please provide plan for paying purchase' })
  @IsString()
  planPayingPurchase: string;

  @IsNotEmpty({ message: 'Please provide cash range' })
  @IsString()
  cashRange: string;

  @IsNotEmpty({ message: 'Please provide credit score' })
  @IsString()
  creditScore: string;

  @IsNotEmpty({ message: 'Please provide bankruptcy' })
  @IsBoolean()
  bankruptcy: boolean;

  @IsNotEmpty({ message: 'Please provide felony' })
  @IsBoolean()
  felony: boolean;

  @IsNotEmpty({ message: 'Please provide current claims' })
  @IsBoolean()
  currentClaims: boolean;

  @IsNotEmpty({ message: 'Please provide Total cash' })
  @IsString()
  totalCash: string;

  @IsNotEmpty({ message: 'Please provide accounts payable' })
  @IsString()
  accountsPayable: string;

  @IsNotEmpty({ message: 'please provide total stock' })
  @IsString()
  totalStock: string;

  @IsNotEmpty({ message: 'please provide payables' })
  @IsString()
  payables: string;

  @IsNotEmpty({ message: 'Please provide retirement funds' })
  @IsString()
  retirementFunds: string;

  @IsNotEmpty({ message: 'Please provide mortgage' })
  @IsString()
  mortgage: string;

  @IsNotEmpty({ message: 'Please provide home equity' })
  @IsString()
  homeEquity: string;

  @IsNotEmpty({ message: 'Please provide other mortgages' })
  @IsString()
  otherMortgages: string;

  @IsNotEmpty({ message: 'Please provide total equity' })
  @IsString()
  totalEquity: string;

  @IsNotEmpty({ message: 'Please provide other liabilities' })
  @IsString()
  otherLiabilities: string;

  @IsNotEmpty({ message: 'Please provide business equity' })
  @IsString()
  businessEquity: string;

  @IsNotEmpty({ message: 'Please provide total liabilities' })
  @IsString()
  totalLiabilities: string;

  @IsNotEmpty({ message: 'Please provide other assets' })
  @IsString()
  otherAssets: string;

  @IsNotEmpty({ message: 'Please provide net worth' })
  @IsString()
  netWorth: string;

  @IsNotEmpty({ message: 'Please provide total assets' })
  @IsString()
  totalAssets: string;

  @IsNotEmpty({ message: 'Please provide liabilites and netWorth' })
  @IsString()
  liabilitesNetWorth: string;
}
