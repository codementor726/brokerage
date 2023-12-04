import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class UpdateImapDto {
  // tlsOptions: { type: Object, default: { rejectUnauthorized: false } },
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  //   @IsOptional()
  //   @IsString()
  //   host: string;

  //   @IsOptional()
  //   @IsNumber()
  //   port: number;

  //   @IsOptional()
  //   @IsNumber()
  //   authTimeout: number;

  //   @IsOptional()
  //   @IsBoolean()
  //   tls: boolean;
}
