import { IsString, IsBoolean, IsNotEmpty, IsArray } from 'class-validator';

export class AssignFolderPermissionDto {
  @IsNotEmpty()
  @IsString()
  child: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsArray()
  userIds: string[];

  @IsNotEmpty()
  @IsBoolean()
  isAllowing: boolean;
}
