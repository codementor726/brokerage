import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTemplateDto {
  @IsNotEmpty({ message: 'please provide leadId.' })
  @IsString()
  leadId: string;

  @IsNotEmpty({ message: 'please provide Template type.' })
  @IsString()
  templateType: string;

  @IsOptional({ message: 'please provide seller_name.' })
  @IsString()
  seller_name: string;

  // @IsNotEmpty({ message: 'please provide seller_companyName.' })
  // @IsString()
  // seller_companyName: string;

  @IsNotEmpty({ message: 'please provide buyer_name.' })
  @IsString()
  buyer_name: string;

  @IsNotEmpty({ message: 'please provide business_title.' })
  @IsString()
  business_title: string;

  @IsNotEmpty({ message: 'please provide business_address.' })
  @IsString()
  business_address: string;

  @IsNotEmpty({ message: 'please provide purchasePrice_manual.' })
  @IsString()
  purchasePrice_manual: string;

  @IsNotEmpty({ message: 'please provide addOn_manual.' })
  @IsString()
  addOn_manual: string;

  @IsNotEmpty({ message: 'please provide pointANumber_manual.' })
  @IsString()
  pointANumber_manual: string;

  @IsNotEmpty({ message: 'please provide pointADays_manual.' })
  @IsString()
  pointADays_manual: string;

  @IsNotEmpty({ message: 'please provide pointBNumber_manual.' })
  @IsString()
  pointBNumber_manual: string;

  @IsNotEmpty({ message: 'please provide pointCNumber1_manual.' })
  @IsString()
  pointCNumber1_manual: string;

  @IsNotEmpty({ message: 'please provide pointCInterest_manual.' })
  @IsString()
  pointCInterest_manual: string;

  @IsNotEmpty({ message: 'please provide pointCNumber2_manual.' })
  @IsString()
  pointCNumber2_manual: string;

  @IsNotEmpty({ message: 'please provide pointDNumber_manual.' })
  @IsString()
  pointDNumber_manual: string;

  @IsOptional({ message: 'please provide lastNumberOfPara1_manual.' })
  @IsString()
  lastNumberOfPara1_manual: string;

  @IsNotEmpty({ message: 'Please provide inspectionDeadlineDay_manual' })
  @IsString()
  inspectionDeadlineDay_manual: string;

  @IsNotEmpty({ message: 'please provide inspectionResolutionDay_manual.' })
  @IsString()
  inspectionResolutionDay_manual: string;

  @IsNotEmpty({ message: 'please provide inspectionTerminationDay_manual.' })
  @IsString()
  inspectionTerminationDay_manual: string;

  @IsNotEmpty({ message: 'please provide pointEYear_manual.' })
  @IsString()
  pointEYear_manual: string;

  // @IsNotEmpty({ message: 'please provide pointFDay_manual.' })
  // @IsString()
  // pointFDay_manual: string;

  @IsNotEmpty({ message: 'please provide assignmentOfContractday_manual.' })
  @IsString()
  assignmentOfContractday_manual: string;

  @IsNotEmpty({ message: 'please provide afterClosing_manual.' })
  @IsString()
  afterClosing_manual: string;

  @IsNotEmpty({ message: 'please provide buyerCompanyName_manual.' })
  @IsString()
  buyerCompanyName_manual: string;

  @IsNotEmpty({ message: 'please provide survivalWarrantyDay_manual.' })
  @IsString()
  survivalWarrantyDay_manual: string;

  @IsNotEmpty({ message: 'please provide buyer_phone.' })
  @IsString()
  buyer_phone: string;

  @IsNotEmpty({ message: 'please provide buyer_email.' })
  @IsString()
  buyer_email: string;

  @IsNotEmpty({ message: 'please provide closingYear_manual.' })
  @IsString()
  closingYear_manual: string;

  @IsNotEmpty({ message: 'please provide sellerAcceptanceDay_manual.' })
  @IsString()
  sellerAcceptanceDay_manual: string;

  @IsNotEmpty({ message: 'please provide seller_phone.' })
  @IsString()
  seller_phone: string;

  @IsNotEmpty({ message: 'please provide seller_email.' })
  @IsString()
  seller_email: string;

  @IsNotEmpty({ message: 'please provide pointADay_manual.' })
  @IsString()
  pointADay_manual: string;

  @IsNotEmpty({ message: 'please provide boker_name.' })
  @IsString()
  boker_name: string;

  @IsNotEmpty({ message: 'please provide boker_phone.' })
  @IsString()
  boker_phone: string;

  @IsNotEmpty({ message: 'please provide pointAYear_manual.' })
  @IsString()
  pointAYear_manual: string;

  @IsNotEmpty({ message: 'please provide pointBDay_manual.' })
  @IsString()
  pointBDay_manual: string;

  @IsNotEmpty({ message: 'please provide pointDDay_manual.' })
  @IsString()
  pointDDay_manual: string;

  @IsNotEmpty({ message: 'please provide broker_email.' })
  @IsString()
  broker_email: string;

  @IsOptional({ message: 'please provide mileRadius.' })
  @IsString()
  mileRadius: string;

  @IsNotEmpty({ message: 'please provide mileRadiusYears.' })
  @IsString()
  mileRadiusYears: string;

  @IsNotEmpty({ message: 'please provide estimatedClosingDate.' })
  @IsString()
  estimatedClosingDate: string;

  @IsNotEmpty({ message: 'please provide timeOfEssenceDays.' })
  @IsString()
  timeOfEssenceDays: string;

  @IsNotEmpty({ message: 'please provide disclosureBroker.' })
  @IsString()
  disclosureBroker: string;

  @IsNotEmpty({ message: 'please provide disclosureBrokerType.' })
  @IsString()
  disclosureBrokerType: string;

  @IsNotEmpty({ message: 'please provide seller_desgination.' })
  @IsString()
  seller_desgination: string;

  @IsNotEmpty({ message: 'please provide closingDate.' })
  @IsString()
  closingDate: string;

  @IsOptional()
  @IsString()
  listingTitle: string;

  @IsOptional()
  @IsString()
  listingCategory: string;
}
