import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { SocketsModule } from 'src/sockets/sockets.module';
import { UserSchema } from 'src/users/user.entity';
import { ChatSchema } from './chat.entity';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { RoomSchema } from './room.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/utils/utils.email.service';
import { AppConfigsModule } from 'src/app-configs/app-configs.module';

@Module({
  imports: [
    AuthModule,
    AppConfigsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => SocketsModule),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Chat', schema: ChatSchema },
      { name: 'Room', schema: RoomSchema },
    ]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, AuthService, EmailService],
  exports: [ChatsService],
})
export class ChatsModule {}
