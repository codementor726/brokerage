import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Stage } from '../interfaces/project.interface';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Busines Id is required.' })
  @IsString()
  business: string;

  @IsOptional()
  @IsString()
  creator: string;

  @IsNotEmpty({ message: 'Name is required.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Assign To is required.' })
  @IsArray()
  @ArrayMinSize(1)
  assignTo: string;

  @IsOptional()
  @IsArray()
  // @ArrayMinSize(1)
  stages: Stage[];
}
