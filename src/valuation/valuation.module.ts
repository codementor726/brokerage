import { Module } from '@nestjs/common';
import { ValuationService } from './valuation.service';
import { ValuationController } from './valuation.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ValuationSchema } from './valuation.entity';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'Valuation', schema: ValuationSchema }]),
  ],
  controllers: [ValuationController],
  providers: [ValuationService],
})
export class ValuationModule {}
