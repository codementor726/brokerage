import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { NewslettersSchema } from './newsletter.entity';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'NewsLetter', schema: NewslettersSchema },
    ]),
  ],
  controllers: [NewslettersController],
  providers: [NewslettersService],
})
export class NewslettersModule {}
