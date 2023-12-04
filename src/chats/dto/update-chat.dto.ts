/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';
import { messageSchmeDto } from 'src/chats/dto/create-message.dto';

export class UpdateChatRoomDto {
  @IsOptional()
  @IsString()
  room: string;

  @IsOptional()
  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  from: string;

  @IsOptional()
  @Type(() => messageSchmeDto)
  message: messageSchmeDto;

  @IsOptional()
  @IsString()
  isReadMessage: number;

  @IsOptional()
  @IsString()
  isDeliveredMessage: boolean;
}
