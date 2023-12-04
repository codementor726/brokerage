import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { ChatsService } from './chats.service';

@Controller('/api/v1/chats')
export class ChatsController {
  constructor(private readonly chatService: ChatsService) {}

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  async getRooms(
    @GetUser() user: IUser,
    @Query() query: pagination,
    @Query('type') type: string,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.chatService.getRooms(user, query, type, search);

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/room/:roomId')
  @UseGuards(AuthGuard(), RolesGuard)
  async getRoom(@Param('roomId') roomId: string) {
    try {
      const data = await this.chatService.getRoom(roomId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/guest-chats-for-admin')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getGuestChats(
    @GetUser() user: IUser,
    @Query() query: pagination,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.chatService.getGuestChats(user, query, search);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/guest-room-messages/:roomId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getGuestRoomMessages(@Param('roomId') roomId: string) {
    try {
      const data = await this.chatService.getGuestRoomMessages(roomId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // get chat messages against Room for user
  @Get('/messages/:room')
  @UseGuards(AuthGuard(), RolesGuard)
  async chatMessages(
    @GetUser() user: IUser,
    @Param('room') room: string,
    @Query() query: pagination,
  ) {
    try {
      const { data, totalCount } = await this.chatService.chatMessages(
        user,
        room,
        query,
      );
      return { results: data.length, data, totalCount };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/start')
  @UseGuards(AuthGuard(), RolesGuard)
  async startChat(
    @GetUser() user: IUser,
    @Body('userIds') userIds: string[],
    @Body('message') message: string,
  ) {
    try {
      const data = await this.chatService.startChat(
        {
          reference: 'one-to-one',
          userIds,
          message,
        },
        user,
      );

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/guest-chat')
  async startChatForDummyUser(
    @Body('firstName') firstName: string,
    @Body('message') message: string,
  ) {
    try {
      const data = await this.chatService.startChatForDummyUser({
        firstName,
        message,
      });

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // join Room for broker
  @Patch('/join')
  @UseGuards(AuthGuard(), RolesGuard)
  async joinRoom(@GetUser() user: IUser, @Body('roomId') roomId: string) {
    try {
      const data = await this.chatService.joinRoom(user, roomId);

      return { status: 'success', data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // reply to guest chat
  @Patch('/reply-to-guest-chat')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async replyToGuestChat(
    @GetUser() user: IUser,
    @Body('roomId') roomId: string,
    @Body('message') message: string,
  ) {
    try {
      const data = await this.chatService.replyToGuestChat(
        user,
        roomId,
        message,
      );

      return { status: 'success', data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // leave Room
  @Patch('/leave')
  @UseGuards(AuthGuard(), RolesGuard)
  async leaveRoom(@GetUser() user: IUser, @Body('roomId') roomId: string) {
    try {
      const data = await this.chatService.leaveRoom(user, roomId);
      return { status: 'success', data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Patch('/end')
  @UseGuards(AuthGuard(), RolesGuard)
  async endRoom(@Body('roomId') roomId: string) {
    try {
      const data = await this.chatService.endRoom(roomId);
      return { status: 'success', data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
