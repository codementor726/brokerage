import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsArray()
  assignedTo: string[];

  // @IsOptional()
  // @IsString()
  // project: string;

  @IsOptional({ message: 'No. of Days are required.' })
  @IsNumber()
  noOfDays: number;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsDateString()
  deadlineDate: Date;
}
