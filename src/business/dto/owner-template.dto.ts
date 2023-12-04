import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OwnerTemplateDto {
  @IsNotEmpty({ message: 'please provide leadId.' })
  @IsString()
  businessId: string;

  @IsNotEmpty({ message: 'please provide is_seller_agency.' })
  @IsString()
  is_seller_agency: string;

  @IsNotEmpty({ message: 'please provide is_transaction_brokerage.' })
  @IsString()
  is_transaction_brokerage: string;

  @IsNotEmpty({ message: 'please provide dba_business_tradename.' })
  @IsString()
  dba_business_tradename: string;

  @IsNotEmpty({ message: 'please provide start_date.' })
  @IsString()
  start_date: string;

  @IsNotEmpty({ message: 'please provide end_date.' })
  @IsString()
  end_date: string;

  // @IsNotEmpty({ message: 'please provide is_seller_agency_only.' })
  // @IsString()
  // is_seller_agency_only: string;

  @IsNotEmpty({ message: 'please provide total_purchase_percent.' })
  @IsString()
  total_purchase_percent: string;

  @IsNotEmpty({ message: 'please provide total_purchase_price.' })
  @IsString()
  total_purchase_price: string;

  @IsNotEmpty({ message: 'please provide asking_price_of_cre.' })
  @IsString()
  asking_price_of_cre: string;

  // @IsNotEmpty({ message: 'please provide terms.' })
  // @IsString()
  // terms: string;

  @IsNotEmpty({ message: 'please provide cash.' })
  @IsString()
  cash: string;

  @IsNotEmpty({ message: 'please provide sba.' })
  @IsString()
  sba: string;

  @IsOptional()
  @IsString()
  other: string;

  @IsNotEmpty({ message: 'please provide earnest_money.' })
  @IsString()
  earnest_money: string;

  // @IsNotEmpty({ message: 'please provide purchase_price.' })
  // @IsString()
  // purchase_price: string;

  @IsNotEmpty({ message: 'please provide leased_items_transaction.' })
  @IsString()
  leased_items_transaction: string;

  @IsNotEmpty({ message: 'please provide price_exclusions.' })
  @IsString()
  price_exclusions: string;

  @IsNotEmpty({ message: 'please provide existing_monetary.' })
  @IsString()
  existing_monetary: string;

  @IsNotEmpty({ message: 'please provide seller_info.' })
  @IsString()
  seller_info: string;

  @IsNotEmpty({ message: 'please provide additional_provisions.' })
  @IsString()
  additional_provisions: string;

  // @IsNotEmpty({ message: 'please provide seller_companyName.' })
  // @IsString()
  // seller_companyName: string;

  @IsNotEmpty({ message: 'please provide current_date.' })
  @IsString()
  current_date: string;

  @IsNotEmpty({ message: 'please provide broker_name.' })
  @IsString()
  broker_name: string;

  @IsNotEmpty({ message: 'please provide business_address.' })
  @IsString()
  business_address: string;

  @IsNotEmpty({ message: 'please provide askng_business_price.' })
  @IsString()
  askng_business_price: string;

  @IsNotEmpty({ message: 'please provide asking_plus_inventory_price.' })
  @IsString()
  asking_plus_inventory_price: string;

  @IsNotEmpty({ message: 'please provide seller_title.' })
  @IsString()
  seller_title: string;

  @IsNotEmpty({ message: 'please provide seller_phone.' })
  @IsString()
  seller_phone: string;

  @IsNotEmpty({ message: 'please provide seller_email.' })
  @IsString()
  seller_email: string;

  @IsNotEmpty({ message: 'please provide broker_phone.' })
  @IsString()
  broker_phone: string;

  @IsNotEmpty({ message: 'please provide broker_email.' })
  @IsString()
  broker_email: string;

  @IsNotEmpty({ message: 'please provide listingTitle.' })
  @IsString()
  listingTitle: string;

  @IsOptional()
  @IsString()
  isTerms: string;

  @IsOptional()
  @IsString()
  isCash: string;

  @IsOptional()
  @IsString()
  isSba: string;
}
