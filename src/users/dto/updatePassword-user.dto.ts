/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserPasswordDto {
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

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  passwordCurrent: string;
}
