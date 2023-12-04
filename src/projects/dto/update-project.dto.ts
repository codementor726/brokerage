import { IsOptional, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional({ message: 'Busines Id is required.' })
  @IsString()
  business: string;

  //   @IsOptional()
  //   @IsString()
  //   creator: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  assignTo: string;
}
