import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { messageSchmeDto } from 'src/chats/dto/create-message.dto';

export class CreateChatRoomDto {
  @IsNotEmpty({ message: 'chat room id is required .' })
  @IsString()
  room: string;

  @IsNotEmpty({ message: 'user to id is required .' })
  @IsString()
  to: string;

  @IsNotEmpty({ message: 'user from id is required .' })
  @IsString()
  from: string;

  @IsNotEmpty({ message: 'message cannot be empty.' })
  @Type(() => messageSchmeDto)
  message: messageSchmeDto;
}
