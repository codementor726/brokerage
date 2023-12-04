import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class DayDto {
  // time should be in format hh:mm
  @IsNotEmpty()
  @IsString()
  from: string;

  // time should be in format hh:mm
  @IsNotEmpty()
  @IsString()
  to: string;
}

class WeeklyRangesDto {
  @IsNotEmpty()
  @Type(() => DayDto)
  monday: DayDto[];

  @IsNotEmpty()
  @Type(() => DayDto)
  tuesday: DayDto[];

  @IsNotEmpty()
  @Type(() => DayDto)
  wednesday: DayDto[];

  @IsNotEmpty()
  @Type(() => DayDto)
  thursday: DayDto[];

  @IsNotEmpty()
  @Type(() => DayDto)
  friday: DayDto[];

  @IsNotEmpty()
  @Type(() => DayDto)
  saturday: DayDto[];

  @IsNotEmpty()
  @Type(() => DayDto)
  sunday: DayDto[];
}

class WeeklyRanges {
  @IsNotEmpty()
  @Type(() => WeeklyRangesDto)
  weeklyRanges: WeeklyRangesDto;
}

export class UpdateBusinessHoursDto {
  @IsNotEmpty()
  @Type(() => WeeklyRanges)
  schedule: WeeklyRanges;
}
