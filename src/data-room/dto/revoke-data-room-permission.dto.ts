import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeDataRoomPermissionDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
