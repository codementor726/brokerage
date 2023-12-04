import { IsString, IsNotEmpty } from 'class-validator';

export class applyTaskDto {
  @IsNotEmpty({ message: 'Template Id is required.' })
  @IsString()
  templateId: string;

  @IsNotEmpty({ message: 'Project Id is required.' })
  @IsString()
  projectId: string;

  @IsNotEmpty({ message: 'Stgage Id is required.' })
  @IsString()
  stage: string;
}
