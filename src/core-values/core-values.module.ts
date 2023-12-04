import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { CoreValuesSchema } from './core-values.entity';
import { CoreValuesController } from './core-values.controller';
import { CoreValuesService } from './core-values.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'CoreValue', schema: CoreValuesSchema },
    ]),
  ],
  controllers: [CoreValuesController],
  providers: [CoreValuesService],
})
export class CoreValuesModule {}
