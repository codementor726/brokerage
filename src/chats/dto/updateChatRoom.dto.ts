import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { messageSchmeDto } from 'src/chats/dto/create-message.dto';

export class UpdateChatRoomDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  user1: string;

  @IsOptional()
  @IsString()
  user2: string;

  @IsOptional()
  @IsString()
  ride: string;

  @IsOptional()
  @IsString()
  @Type(() => messageSchmeDto)
  message: messageSchmeDto[];

  @IsOptional()
  @IsNumber()
  userOneUnreadCount: number;

  @IsOptional()
  @IsNumber()
  userTwoUnreadCount: number;

  @IsOptional()
  @IsString()
  status: string;
}
