import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { join } from 'path';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { INotification } from './interfaces/notification.interface';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

const serviceAccount = join(
  'src',
  'rebavi-1d6b5-firebase-adminsdk-5c6ql-d273adec86.json',
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

import { IUser } from 'src/users/interfaces/user.interface';
import { SocketsGateway } from 'src/sockets/sockets.gateway';

type receiverUser = {
  pushNotifications: boolean;
  inAppNotifications: boolean;
};

type notification = {
  senderMode: string;
  receiver: string;
  receiverUser: receiverUser;
  title: string;
  message: string;
  fcmToken: string[];
  socket: string[];
  payload?: object;
  sender?: string;
  flag?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification')
    private readonly Notification: Model<INotification>,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socket: SocketsGateway,
    private readonly configService: ConfigService,
  ) {}

  async getNotifications(
    user: IUser,
    query: pagination,
  ): Promise<{ notifications: INotification[]; counts: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 8;
    const skip = (page - 1) * limit;
    // sending notification
    const [notfs, newNotifications] = await Promise.all([
      this.Notification.countDocuments({
        receiver: user._id,
        seen: false,
        createdAt: { $gte: user.lastLogin },
      }),

      this.Notification.find({
        receiver: user._id,
        // createdAt: { $gte: user.lastLogin },
      })
        .populate('sender', 'firstName lastName userName photo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      notifications: (newNotifications as INotification[]) || [],
      counts: notfs,
    };
  }

  async seenNotifications(
    user: IUser,
    notificationId: string,
  ): Promise<INotification> {
    const seenNotification = await this.Notification.findOneAndUpdate(
      { _id: notificationId, receiver: user._id },
      {
        seen: true,
        // createdAt: { $gte: user.lastLogin },
      },
      { new: true },
    );

    return seenNotification as INotification;
  }

  async createNotification(notification: notification): Promise<void> {
    const {
      senderMode,
      receiver,
      title,
      message,
      fcmToken,
      socket,
      receiverUser,
    } = notification;

    // const senderUser = await this.User.findById(notification?.receiver).select(
    //   'userName photo isOnline acountType',
    // );

    if (receiverUser.inAppNotifications) {
      const _notification = await this.Notification.create(notification);

      if (!!socket) {
        const __data = await this.socket.server
          // .to(socket)
          .emit('new-notification', {
            senderMode,
            // sender: senderUser,
            receiver,
            title,
            message,
            notification: _notification,
          });
      }
    }

    // SEDNING PUSH NOTIFICATION
    await this.sendPushNotification(notification).catch((err) =>
      console.log(err),
    );
  }

  async sendPushNotification(notification: notification): Promise<void> {
    const { title, message, fcmToken, receiverUser } = notification;

    if (fcmToken?.length > 0 && receiverUser.pushNotifications) {
      const imageUrl = `${this.configService.get(
        'API_HOSTED_URL',
      )}images/notification-logo.png`;

      admin
        .messaging()
        .sendMulticast({
          notification: {
            title: title || 'Brokerage',
            body: message,
            imageUrl,
            // imageUrl:
            //   'https://i.pinimg.com/736x/f0/42/ad/f042ada5fe30d167bc6a9b0c0fc0a60e.jpg',
          },
          tokens: fcmToken,
        })
        .then(() => console.log('notification sent!'))
        .catch((err) => console.log(err));
    }
  }
}
