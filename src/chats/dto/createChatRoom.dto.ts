import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateChatRoomDto {
  @IsNotEmpty({ message: 'chat room name is required .' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  user1: string;

  @IsOptional()
  @IsString()
  user2: string;

  @IsNotEmpty({ message: 'please provide your ride id.' })
  @IsString()
  ride: string;
}

// refering an object id in nest js dto
// https://stackoverflow.com/questions/56907853/how-to-use-objectid-in-nestjs-dto
