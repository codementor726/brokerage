import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty({ message: 'please provide event attendees.' })
  @IsArray()
  attendees: string[];

  @IsOptional()
  @IsArray()
  customerAttendees: string[];

  @IsNotEmpty({ message: 'please provide event name.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'please provide event color code.' })
  @IsString()
  color: string;

  @IsNotEmpty({ message: 'please provide event venue.' })
  @IsString()
  venue: string;

  @IsNotEmpty({ message: 'please provide Agenda.' })
  @IsString()
  agenda: string;

  @IsOptional({ message: 'please provide event description.' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'please provide event start date.' })
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  type: string;

  // @IsNotEmpty({ message: 'please provide event end date.' })
  // @IsString()
  // endDate: string;
}
