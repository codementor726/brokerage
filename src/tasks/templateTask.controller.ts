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
import { CreateTemplateTaskDto } from './dto/create-template.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller({ path: '/api/v1/template-tasks' })
export class TemplateTasksController {
  constructor(private readonly tasksService: TasksService) {}

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
  async getAllTemplateTasksForAdmin(@Query() query: pagination) {
    try {
      const { tasks, totalCount } =
        await this.tasksService.getAllTemplateTasksForAdmin(query);
      return { data: tasks, results: tasks.length, totalCount };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async createTemplateTask(
    @GetUser() user: IUser,
    @Body() createTemplateTaskDto: CreateTemplateTaskDto,
  ) {
    try {
      const rs = await this.tasksService.createTemplateTask(
        user,
        createTemplateTaskDto,
      );

      return { data: rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateTaskTemplate(
    @GetUser() user: IUser,
    @Body('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    try {
      const rs = await this.tasksService.updateTemplateTask(
        user,
        taskId,
        updateTaskDto,
      );
      return { data: rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:templateId/:taskId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteTemplateTask(
    @GetUser() user: IUser,
    @Param('templateId') templateId: string,
    @Param('taskId') taskId: string,
  ) {
    try {
      const rs = await this.tasksService.deleteTemplateTask(
        user,
        templateId,
        taskId,
      );
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }
}
