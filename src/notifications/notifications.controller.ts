import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles-guard.guard';
import { NotificationsService } from './notifications.service';
import { IUser } from '../users/interfaces/user.interface';
import { pagination } from 'src/utils/utils.types';
import { GetUser, Roles } from '../auth/decorators/user.decorator';
import { ErrorHanldingFn } from 'src/utils/utils.helper';

@Controller({
  path: '/api/v1/notifications',
})
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // get all notifcations for user
  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'buyer',
    'seller',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getNotifications(@Query() query: pagination, @GetUser() user: IUser) {
    try {
      const { notifications, counts } =
        await this.notificationService.getNotifications(user, query);
      return { results: notifications.length, data: { notifications, counts } };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Patch('/seenNotifications')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'buyer',
    'seller',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async seenNotifications(@Body('id') id: string, @GetUser() user: IUser) {
    try {
      console.log(user);
      const seenNotification = await this.notificationService.seenNotifications(
        user,
        id,
      );
      return seenNotification;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
