/* eslint-disable prettier/prettier */
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class ResetPasswordUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  passwordConfirm: string;

  @IsOptional()
  @IsString()
  token: string;
}
