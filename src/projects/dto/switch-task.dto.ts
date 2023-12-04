import { IsString, IsNotEmpty } from 'class-validator';

export class SwitchTaskDto {
  @IsNotEmpty({ message: 'Project Id is required.' })
  @IsString()
  projectId: string;

  @IsNotEmpty({ message: 'Stgage From Id is required.' })
  @IsString()
  stageFrom: string;

  @IsNotEmpty({ message: 'Stgage To Id is required.' })
  @IsString()
  stageTo: string;

  @IsNotEmpty({ message: 'Task Id is required.' })
  @IsString()
  taskId: string;
}
