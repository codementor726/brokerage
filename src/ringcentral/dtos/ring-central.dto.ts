import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

class BusinessAddressDto {
  @IsOptional()
  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsNumber()
  zip: number;
}

class CallersDto {
  @IsNotEmpty({ message: 'Caller Id is required' })
  @IsString()
  callerId: string;

  @IsNotEmpty({ message: 'Caller name is required' })
  @IsString()
  name: string;
}

class PhoneDto {
  @IsNotEmpty({ message: 'Phone neumber is required' })
  @IsString()
  phoneNumber: string;
}

class RecipientDto {
  @IsNotEmpty({ message: 'URI is required.' })
  @IsString()
  uri: string;

  @IsNotEmpty({ message: 'Id is required.' })
  @IsNumber()
  id: number;
}

class VoiceMailDto {
  @IsNotEmpty({ message: 'Enabled is required.' })
  @IsBoolean()
  enabled: boolean;

  @IsNotEmpty({ message: 'recipient is required.' })
  @Type(() => RecipientDto)
  recipient: RecipientDto;
}

export class RingCentralMessageDto {
  @IsNotEmpty({ message: 'Message is required.' })
  @IsString()
  message: string;

  @IsOptional({ message: 'User To Id is required.' })
  @IsString()
  toUser: string;

  @IsOptional({ message: 'User To Id is required.' })
  @IsArray()
  to: string[];
}

export class CreateExternalContactDto {
  @IsNotEmpty({ message: 'First Name is required.' })
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'Phone is required.' })
  @IsString()
  businessPhone: string;

  @IsOptional()
  @Type(() => BusinessAddressDto)
  businessAddress: BusinessAddressDto;
}

export class UpdateExternalContactDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  businessPhone: string;

  @IsOptional()
  @Type(() => BusinessAddressDto)
  businessAddress: BusinessAddressDto;
}

export class CreateCallHandling {
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  name: string;

  // Answering rule will be applied when calls are received from the specified caller(s)
  @IsNotEmpty({ message: 'Callers array is required' })
  @Type(() => CallersDto)
  callers: CallersDto[];

  // Answering rules are applied when calling to selected number(s)
  @IsOptional()
  @Type(() => PhoneDto)
  calledNumbers: PhoneDto[];

  // callHandlingAction
  @IsNotEmpty({ message: 'Call handling action is required' })
  @Type(() => VoiceMailDto)
  voicemail: VoiceMailDto;
}

export class UpdateCallHandling extends PartialType(CreateCallHandling) {}
