import { Document } from 'mongoose';

import {
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CurrentLocation {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber()
  // lng,lat
  coordinates: [number, number];
}
