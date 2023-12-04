import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
// import { RideCommissionDto } from './rideCommission.dto';

export class UpdateAppConfigDto {
  @IsOptional()
  @IsString()
  KeyType: string;

  // @IsOptional()
  // @Type(() => RideCommissionDto)
  // rideCommission: RideCommissionDto;

  @IsOptional()
  @IsString()
  totalEarnings: string;
}
