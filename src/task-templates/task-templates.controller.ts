import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { TaskTemplatesService } from './task-templates.service';

@Controller({ path: '/api/v1/project-templates' })
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) {}

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
  async getAllTaskTemplate(
    @Query() query: pagination,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.taskTemplatesService.getAllTaskTemplate(
        query,
        search,
      );
      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/:slug')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getSingleTemplate(@Param('slug') slug: string) {
    try {
      const data = await this.taskTemplatesService.getSingleTemplate(slug);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/create')
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
    @Body('name') name: string,
    @Body('tasks') tasks: string[],
  ) {
    try {
      const data = await this.taskTemplatesService.createTemplateTask(
        name,
        tasks,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
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
  async updateTemplateTask(
    @Body('slug') slug: string,
    @Body('name') name: string,
  ) {
    try {
      const data = await this.taskTemplatesService.updateTemplateTask(
        slug,
        name,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // @Patch('/add-to-template')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  // async addTaskToTemplateTask(
  //   @Body('slug') slug: string,
  //   @Body('tasks') tasks: string[],
  // ) {
  //   try {
  //     const data = await this.taskTemplatesService.addTaskToTemplateTask(
  //       slug,
  //       tasks,
  //     );
  //     return data;
  //   } catch (error) {
  //     return ErrorHanldingFn(error);
  //   }
  // }

  // @Patch('/remove-from-template')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  // async removeTaskFromTemplateTask(
  //   @Body('slug') slug: string,
  //   @Body('tasks') tasks: string[],
  // ) {
  //   try {
  //     const data = await this.taskTemplatesService.removeTaskFromTemplateTask(
  //       slug,
  //       tasks,
  //     );
  //     return data;
  //   } catch (error) {
  //     return ErrorHanldingFn(error);
  //   }
  // }

  @Delete('/delete/:templateId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteTemplate(@Param('templateId') templateId: string) {
    try {
      const data = await this.taskTemplatesService.deleteTemplate(templateId);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
