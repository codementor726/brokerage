import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'please provide task assignees.' })
  @IsArray()
  @ArrayMinSize(1)
  assignedTo: string[];

  @IsNotEmpty({ message: 'please provide task project.' })
  @IsString()
  project: string;

  @IsNotEmpty({ message: 'please provide task title.' })
  @IsString()
  title: string;

  @IsOptional({ message: 'please provide task description.' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Please provide type of the task' })
  @IsString()
  type: string;

  @IsOptional()
  @IsDateString()
  deadlineDate: Date;
}
