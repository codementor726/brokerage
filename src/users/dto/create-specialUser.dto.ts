import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

// class RingCentralDto {
//   @IsOptional()
//   @IsString()
//   clientId: string;

//   @IsOptional()
//   @IsString()
//   clientSecret: string;

//   @IsNotEmpty({ message: 'Please provide ringcentral username' })
//   @IsString()
//   username: string;

//   @IsNotEmpty({ message: 'Please provide ringcentral password' })
//   @IsString()
//   password: string;

//   @IsNotEmpty({ message: 'Please provide ringcentral extension' })
//   @IsString()
//   extension: string;
// }

export class CreateSpecialUser {
  @IsNotEmpty({ message: 'Role can not be empty.' })
  @IsString()
  role: string;

  @IsNotEmpty({ message: 'First name can not be empty.' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last name can not be empty.' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'Email can not be empty.' })
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'Contact can not be empty.' })
  @IsString()
  contact: string;

  @IsNotEmpty({ message: 'Office Contact can not be empty.' })
  @IsString()
  officeContact: string;

  @IsOptional()
  @IsString()
  deskContact: string;

  @IsOptional()
  @IsString()
  cell: string;

  @IsOptional({ message: 'Designation can not be empty.' })
  @IsString()
  designation: string;

  @IsOptional()
  @IsString()
  description: string;

  // @IsOptional()
  // @Type(() => RingCentralDto)
  // ringCentral: RingCentralDto;

  @IsOptional()
  @IsString()
  meetingLink: string;
}

class CreateBulkUser {
  @IsNotEmpty({ message: 'Role can not be empty.' })
  @IsArray()
  role: string[];

  @IsNotEmpty({ message: 'First name can not be empty.' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last name can not be empty.' })
  @IsString()
  lastName: string;

  @IsString()
  photo: string;

  @IsString()
  active: string;

  @IsNotEmpty({ message: 'Email can not be empty.' })
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'Contact can not be empty.' })
  @IsString()
  contact: string;

  @IsOptional()
  @IsString()
  zipcode: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  streetAddress: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  passwordConfirm: string;

  @IsOptional()
  @IsBoolean()
  isCampaignAllowed: boolean;

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
  @IsString()
  designation: string;

  // @IsOptional()
  // @Type(() => RingCentralDto)
  // ringCentral: RingCentralDto;
}

export class CreateBulkUserDTO {
  @IsNotEmpty()
  @Type(() => CreateBulkUser)
  users: CreateBulkUser[];

  @IsNotEmpty({ message: 'Roles are required.' })
  @IsArray()
  role: string[];

  @IsOptional({ message: 'Password can not be empty.' })
  @IsString()
  password: string;
}
