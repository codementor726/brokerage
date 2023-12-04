import { IsBoolean, IsNotEmpty, IsString, IsOptional } from 'class-validator';
export class CreateOurTeamDto {
  @IsNotEmpty({ message: 'please provide Team Mate Id.' })
  @IsString()
  user: string;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
