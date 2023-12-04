import { Module, forwardRef } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from './business.entity';
import { UserSchema } from 'src/users/user.entity';
import { LeadSchema } from 'src/leads/lead.entity';
import { S3Storage } from 'src/utils/utils.s3';
import { LeadsModule } from 'src/leads/leads.module';
import { ProjectSchema } from 'src/projects/entities/project.entity';
import { DataRoomModule } from 'src/data-room/data-room.module';
import { ChatsService } from 'src/chats/chats.service';
import { RoomSchema } from 'src/chats/room.entity';
import { ChatSchema } from 'src/chats/chat.entity';
import { SocketsModule } from 'src/sockets/sockets.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { DraftBusinessSchema } from './draftbusiness.entity';
import { EmailService } from 'src/utils/utils.email.service';
import { AppConfigsModule } from 'src/app-configs/app-configs.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => LeadsModule),
    DataRoomModule,
    SocketsModule,
    NotificationsModule,
    AppConfigsModule,
    MongooseModule.forFeature([
      { name: 'Business', schema: BusinessSchema },
      { name: 'DraftBusiness', schema: DraftBusinessSchema },
      { name: 'Project', schema: ProjectSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Lead', schema: LeadSchema },
      { name: 'Room', schema: RoomSchema },
      { name: 'Chat', schema: ChatSchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService, S3Storage, ChatsService, EmailService],
  exports: [BusinessService],
})
export class BusinessModule {}
