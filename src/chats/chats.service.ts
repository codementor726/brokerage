import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SocketsGateway } from 'src/sockets/sockets.gateway';
import { IUser } from 'src/users/interfaces/user.interface';
import { pagination } from 'src/utils/utils.types';
import { IChat, to } from './interfaces/chat.interface';
import { IRoom, users } from './interfaces/room.interface';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel('User') private readonly User: Model<IUser>,
    @InjectModel('Room') private readonly Room: Model<IRoom>,
    @InjectModel('Chat') private readonly Chat: Model<IChat>,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socket: SocketsGateway, // private readonly socket: SocketsGateway, // private readonly notificationService: NotificationsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationService: NotificationsService,
    private readonly authService: AuthService,
  ) {}

  getReceiverIds(roomUsers: users[], userId: string): IUser[] {
    const toIds = roomUsers
      .filter((ele) => String(ele.userId) !== String(userId))
      .map((el) => el.userId);

    return toIds;
  }

  updateUnreadCount(
    roomUsers: users[],
    userId: string,
    userTo: IUser[],
  ): { users: users[]; to: to[] } {
    const users = roomUsers?.map((ele) => {
      if (String(ele.userId) == String(userId)) {
        ele.unreadCount = 0;
      } else {
        ele.unreadCount += 1;
      }
      return ele;
    });

    const to = userTo?.map((ele) => {
      return {
        userId: ele._id,
        isReadMessage: false,
        isDeliveredMessage: ele.isOnline,
      };
    });

    return { users: users as users[], to: to as to[] };
  }

  // create chat for dummmy user
  async startChatForDummyUser(payload: {
    firstName: string;
    message: string;
  }): Promise<any> {
    const { firstName } = payload;

    const { user, token } = await this.authService.createDummyUser({
      firstName,
    });

    const otherUsers = await this.User.find({
      role: {
        $in: [
          'financial-analyst',
          'buyer-concierge',
          'seller-concierge',
          'executive',
          'admin',
        ],
      },
    })
      .select('_id')
      .lean();

    const userIds = otherUsers.map((el) => el._id);

    userIds.push(user._id);

    const room = await this.createRoom({
      reference: 'guest',
      userIds: userIds,
    });

    const toIds = this.getReceiverIds(room?.users, user._id);

    const userTo: IUser[] = await this.User.find({ _id: { $in: toIds } })
      .select(
        'isOnline fcmToken socketIds pushNotifications inAppNotifications',
      )
      .lean();

    const { users, to } = this.updateUnreadCount(room?.users, user._id, userTo);

    const message = { text: payload.message, user: user._id };

    const updatedRoom = await this.sendMessage({
      roomId: room._id,
      senderId: user._id,
      message,
      to,
      users,
    });

    const notif = userTo?.map((ele) => {
      return this.notificationService.createNotification({
        senderMode: user?.role[0],
        sender: user._id,
        receiver: ele?._id,
        title: `Business Brokerage Services`,
        message: `Guest User: ${user.firstName} has sent a message.`,
        fcmToken: ele?.fcmToken,
        payload: { room: room._id },
        socket: ele?.socketIds,
        flag: 'chat',
        receiverUser: {
          pushNotifications: ele?.pushNotifications,
          inAppNotifications: ele?.inAppNotifications,
        },
      });
    });

    await Promise.all(notif);

    const socketIDs = userTo.map((el) => el.socketIds).flat();

    this.socket.server.to(socketIDs).emit('guest-message', {
      room: updatedRoom?.room,
      chat: updatedRoom?.chat,
    });

    return { token, user: user as IUser, room: updatedRoom?.room as IRoom };
  }

  async updateUsers(params: {
    businessId: string;
    oldBrokers: string[];
    excludedBrokers: string[];
    newBrokers: string[];
  }): Promise<void> {
    const { oldBrokers, businessId, newBrokers, excludedBrokers } = params;

    // const _room = await this.Room.findById(roomId).lean();

    const newUsers = newBrokers.map((user) => ({
      userId: user,
      unreadCount: 0,
    }));

    const filteredUsers = oldBrokers.filter(
      (el) => !excludedBrokers.includes(el),
    );

    await Promise.all([
      this.Room.updateMany(
        { business: businessId },
        {
          $pull: { users: { userId: excludedBrokers } },
          // users: calculatedUsers,
          $addToSet: { leavedUsers: { $each: excludedBrokers as any[] } },
        },
      ),

      this.Room.updateMany(
        { business: businessId },
        { $push: { users: { $each: newUsers as any[] } } },
      ),
    ]);
  }

  async sendMessage(payload: {
    roomId: string;
    senderId: string;
    message: object;
    to: object[];
    users: object[];
  }): Promise<{ room: IRoom; chat: IChat }> {
    const { roomId, senderId, message, to, users } = payload;

    const [room, chat] = await Promise.all([
      this.Room.findByIdAndUpdate(
        roomId,
        {
          lastMessage: message,
          users,
        },
        { new: true },
      )
        .populate('users.userId', 'photo firstName lastName')
        .populate('business', 'title slug status city country')
        .populate({
          path: 'lead',
          select: 'listingID contactName contactPhone status',
          populate: {
            path: 'listingID',
            select: 'title',
          },
        })
        .lean(),
      this.Chat.create({
        room: roomId,
        from: senderId,
        message: message,
        to,
      }),
    ]);

    return { room: room as IRoom, chat: chat as IChat };
  }

  // admin get all guest chats
  async getGuestChats(
    user: IUser,
    query: pagination,
    search?: string,
  ): Promise<{ data: IRoom[]; totalCount: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    if ([null, undefined, 'null', 'undefined'].includes(search)) search = '';

    const chat = await this.Room.aggregate([
      { $match: { reference: 'guest', 'users.userId': user._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'users.userId',
          foreignField: '_id',
          as: 'users',
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        },
      },
      { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { 'users.firstName': { $regex: search, $options: 'i' } },
            { 'users.lastName': { $regex: search, $options: 'i' } },
          ],
        },
      },
      { $group: { _id: null, ids: { $addToSet: '$_id' } } },
    ]);

    const ids = chat[0]?.ids || ([] as string[]);

    const data = await this.Room.find({ _id: { $in: ids } })
      .populate('users.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { data: data as IRoom[], totalCount: ids.length || 0 };
  }

  // get single guest room and its chat
  async getGuestRoomMessages(
    roomId: string,
  ): Promise<{ chat: IChat[]; totalCount: number }> {
    if (!roomId) throw new NotFoundException('Room Id is missing');

    const data = await this.Chat.find({
      room: roomId,
    })
      .sort('-createdAt')
      .lean();

    const totalCount = await this.Chat.countDocuments({
      room: roomId,
    });

    return { chat: data as IChat[], totalCount };
  }

  async replyToGuestChat(
    user: IUser,
    roomId: string,
    message: string,
  ): Promise<IRoom> {
    const joinRoom = await this.joinRoom(user, roomId);

    const toIds = this.getReceiverIds(joinRoom?.users, user._id);

    console.log(toIds);

    const userTo: IUser[] = await this.User.find({ _id: { $in: toIds } })
      .select(
        'isOnline fcmToken socketIds pushNotifications inAppNotifications',
      )
      .lean();

    const { users, to } = this.updateUnreadCount(
      joinRoom?.users,
      user._id,
      userTo,
    );

    const _message = { text: message, user: user._id };

    const updatedRoom = await this.sendMessage({
      roomId: joinRoom._id,
      senderId: user._id,
      message: _message,
      to,
      users,
    });

    const socketIDs = userTo.map((el) => el.socketIds).flat();

    this.socket.server.to(socketIDs).emit('message', {
      room: updatedRoom?.room,
      chat: updatedRoom?.chat,
    });

    return updatedRoom?.room as IRoom;
  }

  // GET chat-rooms for users
  async getRooms(
    user: IUser,
    query: pagination,
    type: string,
    search: string,
  ): Promise<{ data: IRoom[]; totalCount: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    if (['undefiend', undefined, null, null].includes(type))
      type = 'one-to-one';

    if (!['lead-group', 'business-group', 'one-to-one', 'all'].includes(type))
      throw new BadRequestException(
        'Please provide proper type of the room . The correct types are group, lead-group, business-group & one-to-one',
      );

    const chat = await this.Room.aggregate([
      {
        $match: {
          reference: {
            $in: ['lead-group', 'business-group', 'one-to-one'],
          },
          'users.userId': user._id,
          status: 'active',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'users.userId',
          foreignField: '_id',
          as: 'users',
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        },
      },
      { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { 'users.firstName': { $regex: search, $options: 'i' } },
            { 'users.lastName': { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
          ],
        },
      },
      { $group: { _id: null, ids: { $addToSet: '$_id' } } },
    ]);

    const ids = chat[0]?.ids || ([] as string[]);

    const data = await this.Room.find({ _id: { $in: ids } })
      .populate('users.userId', 'photo firstName lastName isOnline lastLogin')
      .populate('business', 'title images')
      .populate({
        path: 'lead',
        select: 'listingID buyer',
        populate: [
          { path: 'listingID', select: 'title' },
          { path: 'buyer', select: 'firstName lastName photo' },
        ],
      })
      .sort('-updatedAt -createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return { data: data as IRoom[], totalCount: ids.length || 0 };
  }

  //get single room
  async getRoom(roomId: string): Promise<IRoom> {
    const data = await this.Room.findById(roomId)
      .populate('users.userId', 'photo firstName lastName isOnline lastLogin')
      .populate('business', 'title')
      .populate({
        path: 'lead',
        select: 'listingID',
        populate: {
          path: 'listingID',
          select: 'title',
        },
      })
      .lean();

    return data as IRoom;
  }

  // GET messages of rooms for user
  async chatMessages(
    user: IUser,
    room: string,
    query: pagination,
  ): Promise<{ data: IChat[]; totalCount: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    if (!room) throw new NotFoundException('Room Id is missing');

    const data = await this.Chat.find({
      $or: [{ from: user._id }, { 'to.userId': user._id }],
      room: room,
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await this.Chat.countDocuments({
      $or: [{ from: user._id }, { 'to.userId': user._id }],
      room: room,
    });

    return { data: data as IChat[], totalCount };
  }

  // POST create-rooms for users
  async createRoom(payload: {
    reference: string;
    userIds: string[];
    business?: string;
    title?: string;
    leadId?: string;
  }): Promise<IRoom> {
    const users = payload.userIds?.map((ele) => {
      return {
        userId: ele,
        unreadCount: 0,
      };
    });

    const _room = await this.Room.create({
      lead: payload?.leadId,
      business: payload?.business,
      reference: payload.reference,
      users,
      title: payload?.title,
    });

    return _room;
  }

  // PATCH join-rooms for broker
  async joinRoom(user: IUser, roomId: string): Promise<IRoom> {
    if (!roomId) throw new NotFoundException('Room Id not found');

    const isRoomJoinable = await this.Room.findOne({
      _id: roomId,
      status: 'active',
    }).lean();

    if (!isRoomJoinable) throw new BadRequestException('Room is not Active');

    // if user is already in the room
    if (
      isRoomJoinable.users.find((el) => String(el.userId) == String(user._id))
    )
      throw new BadRequestException('User has already joined the chat');

    const _user = { userId: user._id, unreadCount: 0 };

    const data = await this.Room.findByIdAndUpdate(
      roomId,
      { $push: { users: _user }, $pull: { leavedUsers: user._id } },
      { new: true },
    )
      .populate('users.userId', 'photo firstName lastName')
      .populate('business', 'title slug status city country')
      .populate({
        path: 'lead',
        select: 'listingID contactName contactPhone status',
        populate: {
          path: 'listingID',
          select: 'title',
        },
      })
      .lean();

    const toIds = this.getReceiverIds(
      isRoomJoinable?.users as users[],
      user._id,
    );

    const receivingUsers = await this.User.find({ _id: { $in: toIds } })
      .select('fcmToken socketIds pushNotifications inAppNotifications')
      .lean();

    // emit socket to the newly joined user
    this.socket.server.emit('group-join', { data });

    // SENDING NOTIFICATION HERE
    const notif = receivingUsers?.map((ele) => {
      return this.notificationService.createNotification({
        senderMode: user?.role[0],
        sender: user._id,
        receiver: ele?._id,
        title: `Business Brokerage Services`,
        message: `${user.firstName} has joined the room.`,
        fcmToken: ele?.fcmToken,
        payload: { room: data._id },
        socket: ele?.socketIds,
        flag: 'chat',
        receiverUser: {
          pushNotifications: ele?.pushNotifications,
          inAppNotifications: ele?.inAppNotifications,
        },
      });
    });

    await Promise.all(notif);

    return data as IRoom;
  }

  async startChat(
    payload: {
      reference: string;
      userIds: string[];
      message: string;
      business?: string;
      leadId?: string;
    },
    user: IUser,
  ): Promise<IRoom> {
    const userIds = [user._id, ...payload.userIds];
    let room = (await this.Room.findOne({
      'users.userId': { $all: userIds },
      reference: 'one-to-one',
      status: 'active',
    }).lean()) as IRoom;

    if (!room) {
      room = await this.createRoom({
        reference: payload.reference,
        userIds: [...payload.userIds, user._id],
        leadId: payload.leadId,
        business: payload.business,
      });
    }

    const toIds = this.getReceiverIds(room?.users, user._id);

    const userTo: IUser[] = await this.User.find({ _id: { $in: toIds } })
      .select(
        'isOnline fcmToken socketIds pushNotifications inAppNotifications',
      )
      .lean();

    const { users, to } = this.updateUnreadCount(room?.users, user._id, userTo);

    const message = { text: payload.message, user: user._id };

    const updatedRoom = await this.sendMessage({
      roomId: room._id,
      senderId: user._id,
      message,
      to,
      users,
    });

    const notif = userTo?.map((ele) => {
      return this.notificationService.createNotification({
        senderMode: user?.role[0],
        sender: user._id,
        receiver: ele?._id,
        title: `Business Brokerage Services`,
        message: `${user.firstName} has sent a message.`,
        fcmToken: ele?.fcmToken,
        payload: { room: room._id },
        socket: ele?.socketIds,
        flag: 'chat',
        receiverUser: {
          pushNotifications: ele?.pushNotifications,
          inAppNotifications: ele?.inAppNotifications,
        },
      });
    });

    await Promise.all(notif);

    const socketIDs = userTo.map((el) => el.socketIds).flat();

    this.socket.server.to(socketIDs).emit('message', {
      room: updatedRoom?.room,
      chat: updatedRoom?.chat,
    });

    return updatedRoom?.room as IRoom;
  }

  async addUserToGroups(user: IUser): Promise<void> {
    const userInfo = { userId: user._id, unreadCount: 0 };
    await this.Room.updateMany(
      {
        reference: 'business-group',
        status: 'active',
      },
      { $push: { users: userInfo } },
    );
  }

  // PATCH leave-rooms for users
  async leaveRoom(user: IUser, roomId: string): Promise<[Error, IRoom]> {
    const room = await this.Room.findById(roomId).lean();

    if (!room) [new NotFoundException('Room Id is missing'), null];

    let { users, status } = room;
    users = users?.filter((ele) => String(ele.userId) != String(user._id));

    const data = await this.Room.findByIdAndUpdate(
      roomId,
      { status, users, $addToSet: { leavedUsers: user._id } },
      { new: true },
    )
      .populate('users.userId', 'photo firstName lastName')
      .populate('business', 'title slug status city country')
      .populate({
        path: 'lead',
        select: 'listingID contactName contactPhone status',
        populate: { path: 'listingID', select: 'title' },
      })
      .lean();

    if (!data) return [new NotFoundException('Conversation not found'), null];

    return [null, data as IRoom];
  }

  // PATCH END-room
  async endRoom(roomId: string): Promise<IRoom> {
    const room = await this.Room.findById(roomId).lean();

    if (!room) throw new NotFoundException('Room Id is missing');

    const data = await this.Room.findByIdAndUpdate(
      roomId,
      { status: 'end' },
      { new: true },
    )
      .populate('users.userId', 'photo firstName lastName')
      .populate('business', 'title slug status city country')
      .populate({
        path: 'lead',
        select: 'listingID contactName contactPhone status',
        populate: {
          path: 'listingID',
          select: 'title',
        },
      })
      .lean();

    return data as IRoom;
  }

  // close chat Room()
  async endChatRooms(payload: {
    business: string;
    leadIds: string[];
    userIds: string[];
  }): Promise<void> {
    const { business, leadIds, userIds } = payload;

    const roomIds = await this.Room.find({
      business,
      lead: { $in: leadIds },
      'users.userId': { $in: userIds },
    })
      .distinct('_id')
      .lean();

    if (!roomIds) throw new NotFoundException('Rooms not found!');

    await this.Room.updateMany({ _id: { $in: roomIds } }, { status: 'end' });
  }
}
