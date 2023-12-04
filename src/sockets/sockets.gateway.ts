import { InjectModel } from '@nestjs/mongoose';

import { forwardRef, Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { ChatsService } from 'src/chats/chats.service';
import { IChat } from 'src/chats/interfaces/chat.interface';
import { IRoom } from 'src/chats/interfaces/room.interface';
import { NotificationsService } from 'src/notifications/notifications.service';
import { IUser } from 'src/users/interfaces/user.interface';
// import { setMarkAsReadCount, setNewMessageCount } from 'src/utils/utils.helper';

@WebSocketGateway()
/*
{
  // namespace: 'chat',
  cors: {
    origin: '*',
    credentials: true,
  },
  */
export class SocketsGateway {
  @WebSocketServer() server: Server;
  constructor(
    @InjectModel('User') private readonly User: Model<IUser>,
    @InjectModel('Room') private readonly Room: Model<IRoom>,
    @InjectModel('Chat') private readonly Chat: Model<IChat>,
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationService: NotificationsService, // private readonly notificationService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    console.log('Init');
  }

  // when user joins the app
  @SubscribeMessage('join')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string },
  ) {
    try {
      if (!payload) throw new Error('Payload is empty');

      await Promise.all([
        this.User.findByIdAndUpdate(
          payload.id,
          {
            $push: { socketIds: client.id },
            isOnline: true,
          },
          { new: true },
        ),
        this.Chat.updateMany(
          { 'to.userId': payload.id },
          {
            $set: {
              'to.$.isDeliveredMessage': true,
            },
          },
        ),
      ]);
    } catch (error) {
      console.log(error.message);
    }
  }

  // when user disconnects with the app
  @SubscribeMessage('disconnecting')
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      await this.User.findOneAndUpdate(
        { socketIds: client.id },
        { $pull: { socketIds: client.id }, isOnline: false },
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  // mark-as-read
  @SubscribeMessage('mark-as-read')
  async markAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string },
  ) {
    await Promise.all([
      this.Room.findOneAndUpdate(
        { _id: payload.roomId, 'users.userId': payload.userId },
        { 'users.$.unreadCount': 0 },
        { new: true },
      ),
      this.Chat.updateMany(
        { room: payload.roomId, 'to.userId': payload.userId },
        {
          $set: {
            'to.$.isReadMessage': true,
            'to.$.isDeliveredMessage': true,
          },
        },
      ),
    ]);
  }

  // chatJoin
  @SubscribeMessage('chatJoin')
  async chatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string },
  ) {
    // joining room
    client.join(payload.roomId);

    await Promise.all([
      // when user join the room
      this.Chat.updateMany(
        { room: payload.roomId, 'to.userId': payload.userId },
        {
          $set: {
            'to.$.isDeliveredMessage': true,
            'to.$.isReadMessage': true,
          },
        },
      ),

      // setting unread count zero of room
      this.Room.findOneAndUpdate(
        { _id: payload.roomId, 'users.userId': payload.userId },
        { 'users.$.unreadCount': 0 },
        { new: true },
      ),
    ]);
  }

  @SubscribeMessage('msg')
  async handleMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { message: object; from: string; roomId: string },
  ) {
    try {
      const [userFrom, _room] = await Promise.all([
        this.User.findById(payload.from),
        this.Room.findById(payload.roomId),
      ]);

      const toIds = await this.chatsService.getReceiverIds(
        _room?.users,
        payload.from,
      );

      const userTo: IUser[] = await this.User.find({ _id: { $in: toIds } })
        .select(
          'isOnline fcmToken socketIds pushNotifications inAppNotifications',
        )
        .lean();

      if (!userTo || !userFrom || !_room) throw new Error('Invalid data');

      const { users, to } = await this.chatsService.updateUnreadCount(
        _room?.users,
        payload.from,
        userTo,
      );

      const [updatedRoom, createdChat] = await Promise.all([
        this.Room.findByIdAndUpdate(payload.roomId, {
          lastMessage: payload.message,
          users,
        }),
        this.Chat.create({
          room: payload.roomId,
          from: payload.from,
          message: payload.message,
          to,
        }),
      ]);

      const notif = [];

      userTo?.forEach((ele) => {
        notif.push(
          this.notificationService.createNotification({
            senderMode: userFrom?.role[0],
            sender: userFrom._id,
            receiver: ele?._id,
            title: `Business Brokerage Services`,
            message: `${userFrom.firstName} has sent a message.`,
            fcmToken: ele?.fcmToken,
            payload: { room: payload.roomId },
            socket: ele?.socketIds,
            flag: 'chat',
            receiverUser: {
              pushNotifications: ele?.pushNotifications,
              inAppNotifications: ele?.inAppNotifications,
            },
          }),
        );
      });

      client.to(payload.roomId).emit('msg', createdChat, payload.roomId);

      await Promise.all(notif);
    } catch (e) {
      console.log(e, 'msg submit error');
    }
  }
}
