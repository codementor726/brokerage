import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
export class CreateNewsLetterDto {
  @IsNotEmpty({ message: 'please provide First Name.' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'please provide Last Name.' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'please provide Contact.' })
  @IsString()
  contact: string;

  @IsNotEmpty({ message: 'please provide Email.' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'please provide Message.' })
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  recommendFrom: string;

  @IsOptional()
  @IsString()
  businessName: string;
}
