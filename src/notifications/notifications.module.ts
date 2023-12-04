import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UserSchema } from 'src/users/user.entity';
import { NotificationSchema } from 'src/notifications/notification.entity';

import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { SocketsModule } from 'src/sockets/sockets.module';

@Module({
  imports: [
    forwardRef(() => SocketsModule),
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
