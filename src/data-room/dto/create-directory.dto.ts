import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class CreateDirectoryDto {
  @IsNotEmpty({ message: 'Folder name is required.' })
  @IsString()
  folderName: string;

  @IsNotEmpty({ message: 'Role(s) is required.' })
  @IsArray()
  @ArrayMinSize(1)
  roles: string[];
}
