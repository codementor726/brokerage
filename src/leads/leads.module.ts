import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { BusinessSchema } from 'src/business/business.entity';
import { UserSchema } from 'src/users/user.entity';
import { EmailService } from 'src/utils/utils.email.service';
import { LeadSchema } from './lead.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ChatsService } from 'src/chats/chats.service';
import { ChatSchema } from 'src/chats/chat.entity';
import { RoomSchema } from 'src/chats/room.entity';
import { SocketsModule } from 'src/sockets/sockets.module';
import { S3Storage } from 'src/utils/utils.s3';
import { BusinessModule } from 'src/business/business.module';
import { AppConfigsModule } from 'src/app-configs/app-configs.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    SocketsModule,
    AppConfigsModule,
    forwardRef(() => BusinessModule),
    MongooseModule.forFeature([
      { name: 'Lead', schema: LeadSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Business', schema: BusinessSchema },
      { name: 'Chat', schema: ChatSchema },
      { name: 'Room', schema: RoomSchema },
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService, EmailService, ChatsService, S3Storage],
  exports: [LeadsService],
})
export class LeadsModule {}
