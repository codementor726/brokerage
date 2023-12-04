import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from 'src/business/business.entity';
import { LeadSchema } from 'src/leads/lead.entity';
import { MailsModule } from 'src/mails/mails.module';
import { CronService } from './crons.service';

@Module({
  imports: [
    MailsModule,
    MongooseModule.forFeature([
      { name: 'Business', schema: BusinessSchema },
      { name: 'Lead', schema: LeadSchema },
    ]),
  ],
  providers: [CronService],
})
export class CronsModule {}
