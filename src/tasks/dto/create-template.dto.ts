import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTemplateTaskDto {
  // @IsNotEmpty({ message: 'please provide task project.' })
  // @IsString()
  // project: string;

  @IsNotEmpty({ message: 'please provide task title.' })
  @IsString()
  title: string;

  @IsOptional({ message: 'please provide task description.' })
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  noOfDays: number;

  @IsNotEmpty({ message: 'Please provide type of the task' })
  @IsString()
  type: string;

  @IsNotEmpty({ message: 'Please provide slug' })
  @IsString()
  slug: string;
}
