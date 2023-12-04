/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsDate,
  IsString,
  
} from 'class-validator';


export class CreateNotificationDto {
  @IsNotEmpty({ message: 'sender id is required .' })
  @IsString()
  sender: string;

  @IsNotEmpty({ message: 'senderMode is required .' })
  @IsString()
  senderMode: string;

  @IsNotEmpty({ message: 'receiver id is required .' })
  @IsString()
  receiver: string;

  @IsNotEmpty({ message: 'message is required .' })
  @IsString()
  message: string;

  @IsNotEmpty({ message: 'title is required .' })
  @IsString()
  title: string;
}
