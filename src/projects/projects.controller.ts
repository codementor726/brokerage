import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { SwitchTaskDto } from './dto/switch-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from 'src/auth/decorators/user.decorator';
import { pagination } from 'src/utils/utils.types';
import { IUser } from 'src/users/interfaces/user.interface';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { applyTaskDto } from './dto/apply-task.dto';
import {
  CreateProjectStageDto,
  UpdateProjectStageDto,
} from './dto/add-project-stag.dto';
import { UpdateTaskDto } from 'src/tasks/dto/update-task.dto';

@Controller({ path: '/api/v1/projects' })
export class ProjectsController {
  constructor(private readonly Projectservice: ProjectsService) {}

  @Get('/businesses-without-projects')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getBusinessWithoutProjects(@GetUser() user: IUser) {
    try {
      const data = await this.Projectservice.getBusinessWithoutProjects(user);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  ///////////////////////////////////////
  //  STAGE CONTROLLER STARTED
  ///////////////////////////////////////
  @Post('/stag/add')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async addStag(
    @GetUser() user: IUser,
    @Body() addStag: CreateProjectStageDto,
  ) {
    try {
      const data = await this.Projectservice.addStag(user, addStag);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/stag/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateStag(
    @GetUser() user: IUser,
    @Body() updateStagDTO: UpdateProjectStageDto,
  ) {
    try {
      const data = await this.Projectservice.updateStag(user, updateStagDTO);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Delete('/delete-stag/:projectId/:stageId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteStag(
    // @GetUser() user: IUser,
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
  ) {
    try {
      const data = await this.Projectservice.deleteStag(
        // user,
        projectId,
        stageId,
      );

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  // @Post('/stag/add')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  // async addStag(
  //   @GetUser() user: IUser,
  //   @Body() addStag: CreateProjectStageDto,
  // ) {
  //   try {
  //     const data = await this.Projectservice.addStag(user, addStag);

  //     return { data };
  //   } catch (error) {
  //     throw ErrorHanldingFn(error);
  //   }
  // }

  ///////////////////////////////////////
  //  STAGE CONTROLLER ENDED
  ///////////////////////////////////////

  ///////////////////////////////////////
  //  TASK CONTROLLER STARTED
  ///////////////////////////////////////
  @Post('/add-task')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async addTask(
    @GetUser() user: IUser,
    @Body() addTask: CreateTaskDto,
    @Body('stageId') stageId: string,
  ) {
    try {
      const data = await this.Projectservice.addTask(user, stageId, addTask);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-task/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateTask(
    @GetUser() user: IUser,
    @Param('id') id: string,
    @Body() updateTask: UpdateTaskDto,
  ) {
    try {
      const data = await this.Projectservice.updateTask(user, id, updateTask);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/apply/template')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async applyTemplateToTheProject(
    @GetUser() user: IUser,
    @Body() applyTask: applyTaskDto,
  ) {
    try {
      const data = await this.Projectservice.applyTemplateToProject({
        user,
        applyTask,
      });

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Delete('/delete-task/:projectId/:stageId/:taskId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async deleteTask(
    @GetUser() user: IUser,
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Param('taskId') taskId: string,
  ) {
    try {
      const data = await this.Projectservice.deleteTask({
        user,
        projectId,
        stageId,
        taskId,
      });

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/switch-task')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async switchTask(@GetUser() user: IUser, @Body() switchTask: SwitchTaskDto) {
    try {
      const data = await this.Projectservice.switchTask(user, switchTask);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  ///////////////////////////////////////
  //  TASK CONTROLLER ENDED
  ///////////////////////////////////////
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
  async getProjects(
    @GetUser() user: IUser,
    @Query() query: pagination,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.Projectservice.getProjects(query, user, search);

      return { data: { results: data?.project?.length || 0, ...data } };
    } catch (error) {
      throw ErrorHanldingFn(error);
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
  async getSingleProject(@Param('slug') slug: string) {
    try {
      const data = await this.Projectservice.getSingleProject(slug);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async addProject(
    @GetUser() user: IUser,
    @Body() createProject: CreateProjectDto,
  ) {
    try {
      const data = await this.Projectservice.addProject(user, createProject);
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/:slug')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateProject(
    // @GetUser() user: IUser,
    @Param('slug') slug: string,
    @Body() updateProject: UpdateProjectDto,
  ) {
    try {
      const data = await this.Projectservice.updateProject(slug, updateProject);
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Delete('/:slug')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async DeleteProject(@Param('slug') slug: string) {
    try {
      const data = await this.Projectservice.deleteProject(slug);
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }
}
