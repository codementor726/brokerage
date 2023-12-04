import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
} from 'class-validator';

class NotesDto {
  @IsNotEmpty({ message: 'please provide creator Id' })
  @IsString()
  creator: string;

  @IsNotEmpty({ message: 'please provide message of the note' })
  @IsString()
  message: string;
}
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  photo: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  designation: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  meetingLink: string;

  @IsOptional()
  @IsNumber()
  zipCode: number;

  @IsOptional()
  @IsString()
  mobilePhone: string;

  @IsOptional()
  @IsString()
  HomePhone: string;

  @IsOptional()
  @IsString()
  workPhone: string;

  @IsOptional()
  @Type(() => NotesDto)
  notes: NotesDto[];
}
