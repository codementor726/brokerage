import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name can not be empty.' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last name can not be empty.' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'Email can not be empty.' })
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  contact: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsBoolean()
  isCampaignAllowed: boolean;

  @IsNotEmpty({ message: 'Password can not be empty.' })
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  password: string;

  @IsNotEmpty({ message: 'Confirm password can not be empty.' })
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  passwordConfirm: string;

  // @IsNotEmpty({ message: 'Role can not be empty.' })
  // @IsString()
  // role: string;

  @IsOptional()
  @IsNotEmpty({ message: 'fcmToken is cannot be empty.' })
  fcmToken: string;
}
