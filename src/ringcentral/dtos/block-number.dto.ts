import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BlockNumberDto {
  @IsNotEmpty({ message: 'Please provide phone number' })
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  label: string;

  //   status: Blocked | Allowed
  @IsNotEmpty({ message: 'Please provide status' })
  @IsString()
  status: string;
}
