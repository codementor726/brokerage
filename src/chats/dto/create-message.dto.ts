/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class messageSchmeDto {
  @IsNotEmpty({ message: 'please write some message.' })
  @IsString()
  text: string;

  @IsNotEmpty({ message: 'please provide user id.' })
  @IsObject()
  user: object;
}
