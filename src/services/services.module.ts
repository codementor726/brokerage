import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { ServiceSchema } from './services.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { S3Storage } from 'src/utils/utils.s3';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'Service', schema: ServiceSchema }]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, S3Storage],
  exports: [ServicesService],
})
export class ServicesModule {}
