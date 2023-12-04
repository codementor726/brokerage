import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
export class CreateReviewDto {
  @IsNotEmpty({ message: 'please provide Title.' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'please provide Description.' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'please provide Username.' })
  @IsString()
  userName: string;

  @IsNotEmpty({ message: 'please provide Role.' })
  @IsString()
  role: string;
}
