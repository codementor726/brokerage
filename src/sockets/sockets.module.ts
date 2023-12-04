import { forwardRef, Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { RoomSchema } from 'src/chats/room.entity';
import { SocketsGateway } from './sockets.gateway';
import { UserSchema } from 'src/users/user.entity';
import { ChatSchema } from 'src/chats/chat.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ChatsModule } from 'src/chats/chats.module';
import { ChatsService } from 'src/chats/chats.service';

@Module({
  imports: [
    // UsersModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => ChatsModule),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Chat', schema: ChatSchema },
      { name: 'Room', schema: RoomSchema },
    ]),
  ],

  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}
