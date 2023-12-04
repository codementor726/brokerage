import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Stage } from '../interfaces/project.interface';

export class CreateProjectStageDto {
  @IsNotEmpty({ message: 'Project Id is required.' })
  @IsString()
  projectId: string;

  @IsNotEmpty({ message: 'Stage name is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  user: string;
}

export class UpdateProjectStageDto {
  @IsNotEmpty({ message: 'Project Id is required.' })
  @IsString()
  projectId: string;

  @IsNotEmpty({ message: 'Project Id is required.' })
  @IsString()
  stagId: string;

  @IsOptional({ message: 'Busines Id is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  user: string;
}
