/* eslint-disable prettier/prettier */
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  password: string;

  @IsOptional()
  @IsNotEmpty({ message: 'fcmToken is cannot be empty.' })
  fcmToken: string;
}
