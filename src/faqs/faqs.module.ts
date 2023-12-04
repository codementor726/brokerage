import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { faqsSchema } from './faq.entity';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'Faq', schema: faqsSchema }]),
  ],
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
