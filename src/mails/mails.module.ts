import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailsController } from './mails.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { S3Storage } from 'src/utils/utils.s3';
import { EmailService } from 'src/utils/utils.email.service';
import { AppConfigsModule } from 'src/app-configs/app-configs.module';

@Module({
  imports: [
    // NotificationsModule,
    AuthModule,
    AppConfigsModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [MailsController],
  providers: [MailsService, S3Storage, EmailService],
  exports: [MailsService],
})
export class MailsModule {}
