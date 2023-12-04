import {
  Body,
  Controller,
  Delete,
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
import { GroupsService } from './groups.service';

@Controller({
  path: '/api/v1/groups',
})
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getAllGroups(
    @Query() query: pagination,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.groupsService.getAllGroups(query, search);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/create')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async createGroup(
    @Body('name') name: string,
    @Body('users') users: string[],
    @Body('type') type: string,
    @Body('listings') listings: string[],
    @Body('status') status: string[],
  ) {
    try {
      const data = await this.groupsService.createGroup(
        name,
        users,
        type,
        listings,
        status,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/send-mail')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async sendMessageToGroupUsers(
    @GetUser() user: IUser,
    @Body('templateId') templateId: string,
    @Body('groupId') groupId: string,
    @Body('cc') cc: string[],
  ) {
    try {
      const data = await this.groupsService.sendMessageToGroupUsers(
        templateId,
        groupId,
        cc,
        user,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateGroup(
    @Body('groupId') groupId: string,
    @Body('name') name: string,
    @Body('users') users: string[],
    @Body('type') type: string,
    @Body('listings') listings: string[],
    @Body('status') status: string[],
  ) {
    try {
      const data = await this.groupsService.updateGroup(
        groupId,
        name,
        users,
        type,
        listings,
        status,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:groupId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteGroup(@Param('groupId') groupId: string) {
    try {
      const data = await this.groupsService.deleteGroup(groupId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
