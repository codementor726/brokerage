import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { TaskTemplatesService } from 'src/task-templates/task-templates.service';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { UpdateTaskDto } from 'src/tasks/dto/update-task.dto';
import { ITask, Task } from 'src/tasks/interfaces/task.interface';
import { TasksService } from 'src/tasks/tasks.service';
import { IUser } from 'src/users/interfaces/user.interface';
import { includes, matchRoles } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import {
  CreateProjectStageDto,
  UpdateProjectStageDto,
} from './dto/add-project-stag.dto';
import { applyTaskDto } from './dto/apply-task.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { SwitchTaskDto } from './dto/switch-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { IProject, Stage } from './interfaces/project.interface';
import { IBusiness } from '../business/interfaces/business.interface';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel('Project')
    private readonly Project: Model<IProject>,
    @InjectModel('Business')
    private readonly Business: Model<IBusiness>,
    private readonly tasksService: TasksService, // private readonly emailService: EmailService,
    private readonly notificationService: NotificationsService, // private readonly configService: ConfigService,
    private readonly taskTemplatesService: TaskTemplatesService,
  ) {}

  ///////////////////////////////////////
  //  STAGE CONTROLLER STARTED
  ///////////////////////////////////////

  async addStag(
    user: IUser,
    stagDTO: CreateProjectStageDto,
  ): Promise<IProject> {
    // FETCHING PROJECT
    const project = await this.Project.findById(stagDTO.projectId).lean();

    if (!project) throw new BadRequestException('Project Not Found');

    stagDTO.user = user._id;

    const updatedProject = await this.Project.findByIdAndUpdate(
      project._id,
      { $push: { stages: stagDTO as unknown as Stage } },
      { new: true, runValidators: true },
    )
      .populate([
        { path: 'stages.tasks' },
        { path: 'stages.user', select: 'firstName lastName photo' },
      ])
      .lean();

    return updatedProject as IProject;
  }

  async updateStag(
    user: IUser,
    updateStagDTO: UpdateProjectStageDto,
  ): Promise<IProject> {
    // FETCHING PROJECT
    // const project = await this.Project.findById(stagDTO.projectId).lean();

    // if (!project) throw new BadRequestException('Project Not Found');

    const updatedProject = await this.Project.findOneAndUpdate(
      { _id: updateStagDTO.projectId, 'stages._id': updateStagDTO.stagId },
      {
        $set: {
          'stages.$.name': updateStagDTO?.name,
          'stages.$.user': user?._id,
        },
      },
      { new: true, runValidators: true },
    )
      .populate([
        { path: 'stages.tasks' },
        { path: 'stages.user', select: 'firstName lastName photo' },
      ])
      .lean();

    return updatedProject as IProject;
  }

  async deleteStag(
    // user: IUser,
    projectId: string,
    stage: string,
  ): Promise<IProject> {
    // FETCHING PROJECT
    const project = await this.Project.findById(projectId).lean();

    if (!project) throw new BadRequestException('Project Not Found');

    const _stage = project?.stages?.find(
      (el) => String((el as any)._id) == stage,
    );

    if (!_stage) throw new BadRequestException('Stage not found');

    const [updatedProject] = await Promise.all([
      this.Project.findByIdAndUpdate(
        projectId,
        { $pull: { stages: { _id: stage } } as any },
        { new: true, runValidators: true },
      )
        .populate([
          { path: 'stages.tasks' },
          { path: 'stages.user', select: 'firstName lastName photo' },
        ])
        .lean(),
      this.tasksService.deleteProjectStageTasksByIds(_stage.tasks),
    ]);

    return updatedProject as unknown as IProject;
  }
  ///////////////////////////////////////
  //  STAGE CONTROLLER ENDED
  ///////////////////////////////////////

  async getSingleProject(slug: string): Promise<IProject> {
    const project = await this.Project.findOne({ slug })
      .populate([
        {
          path: 'stages.tasks',
          populate: { path: 'assignedTo' },
        },
        { path: 'stages.user', select: 'firstName lastName photo role' },
      ])
      .lean();
    console.log(project.assignTo);
    return project as IProject;
  }

  async getBusinessWithoutProjects(user: IUser): Promise<IBusiness[]> {
    const projectsWithBusiness = (await this.Project.find()).map(
      (el) => el.business,
    );

    let businesses = await this.Business.find({
      _id: { $nin: projectsWithBusiness },
    });

    if (user.role.includes('broker'))
      businesses = businesses.filter((el) => includes(user._id, el.broker));

    return businesses as IBusiness[];
  }

  async getProjects(
    query: pagination,
    user: IUser,
    search?: string,
  ): Promise<{ totalCount: number; project: IProject[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    let q: object = {
      name: new RegExp(search, 'i'),
    };

    const admins = [
      'admin',
      'financial-analyst',
      'buyer-concierge',
      'seller-concierge',
      'executive',
    ];

    if (!matchRoles(admins, user.role)) {
      // admin & related role cases
      q = { $or: [{ creator: user._id }, { assignTo: user._id }], ...q };
    }

    const [count, projects] = await Promise.all([
      this.Project.countDocuments(),
      this.Project.find(q)
        .populate([
          { path: 'stages.tasks' },
          { path: 'stages.user', select: 'firstName lastName photo' },
        ])
        .populate([{ path: 'business' }, { path: 'assignTo' }])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return { totalCount: count, project: projects as IProject[] };
  }

  // async applyTemplateToProject(payload: {
  //   user: IUser;
  //   applyTask: applyTaskDto;
  // }): Promise<IProject> {
  //   // FETCHING PROJECT
  //   const project = await this.Project.findById(
  //     payload.applyTask.projectId,
  //   ).lean();

  //   if (!project) throw new BadRequestException('Project Not Found');

  //   const _stage = project?.stages?.find(
  //     (el) => String((el as any)._id) == payload.applyTask.stage,
  //   );

  //   if (!_stage) throw new BadRequestException('Project Stage not found');

  //   // GET ALL TEMPLATE TASKS
  //   const _tasks = await this.tasksService.getAllTemplateTasks();

  //   const taskIds = await this.tasksService.insertManyTasks(
  //     payload.user,
  //     payload.applyTask.projectId,
  //     _tasks as unknown as Task[],
  //   );

  //   _stage.tasks.push(...taskIds);

  //   const _project = await this.Project.findOneAndUpdate(
  //     { _id: project._id, 'stages._id': (_stage as any)._id },
  //     { $set: { 'stages.$.tasks': _stage.tasks } },
  //     { new: true },
  //   )
  //     .populate([
  //       { path: 'stages.tasks' },
  //       { path: 'stages.user', select: 'firstName lastName photo' },
  //     ])
  //     .lean();

  //   return _project as IProject;
  // }

  getStages(user: IUser): Array<Stage> {
    const stages = [
      { name: 'To Do', user: '', tasks: [] },
      { name: 'Due This Week ', user: '', tasks: [] },
      { name: 'Pending', user: '', tasks: [] },
      { name: 'Completed', user: '', tasks: [] },
    ].map((stage) => {
      stage.user = user._id;

      return stage;
    });

    return stages;
  }

  async addProject(
    user: IUser,
    createProject: CreateProjectDto,
  ): Promise<IProject> {
    // ASSIGING USER IDS
    createProject.creator = user._id;
    createProject.stages = this.getStages(user);

    const count = await this.Project.countDocuments({});
    const slug = slugify(`${createProject.name}-${count}`, { lower: true });

    const project = await this.Project.create({ ...createProject, slug });
    const populatedProject = await (
      await this.Project.findById(project?._id)
    ).populate([{ path: 'business' }, { path: 'assignTo' }]);
    return populatedProject;
  }

  async updateProject(
    slug: string,
    updateProject: UpdateProjectDto,
  ): Promise<IProject> {
    const project = await this.Project.findOneAndUpdate(
      { slug },
      updateProject,
      {
        new: true,
      },
    ).populate([
      { path: 'stages.tasks' },
      { path: 'stages.user', select: 'firstName lastName photo' },
    ]);

    return project as IProject;
  }

  async deleteProject(slug: string): Promise<IProject> {
    const project = await this.Project.findOneAndDelete({ slug });

    if (!!project) await this.tasksService.deleteProjectTasks(project._id);

    return project as IProject;
  }

  ///////////////////////////////////////
  //  TASK CONTROLLER STARTED
  ///////////////////////////////////////

  async addTask(
    user: IUser,
    stageId: string,
    addTask: CreateTaskDto,
  ): Promise<IProject> {
    const project = await this.Project.findById(addTask.project);

    if (!project)
      throw new BadRequestException(
        'Project Not Found or it may not assign to you',
      );
    /*  
    { _id: lounge, 'rooms._id': room },
      {
        $pull: { guests: userId },
        $set: { 'rooms.$': updatedRoom },
      },
       */
    const _stage = project?.stages?.find(
      (el) => String((el as any)._id) == stageId,
    );

    if (!_stage) throw new BadRequestException('Project Stage not found');

    const task = await this.tasksService.createTask(user, addTask);

    _stage.tasks.push(task._id);

    const _project = await this.Project.findOneAndUpdate(
      { _id: project._id, 'stages._id': (_stage as any)._id },
      { $set: { 'stages.$.tasks': _stage.tasks } },
      { new: true },
    )
      .populate([
        {
          path: 'stages.tasks',
          populate: {
            path: 'assignedTo',
            select: 'firstName lastName photo role',
          },
        },
        { path: 'stages.user', select: 'firstName lastName photo' },
      ])
      .lean();

    return _project as IProject;
  }

  async updateTask(
    user: IUser,
    taskId: string,
    updateTask: UpdateTaskDto,
  ): Promise<ITask> {
    const task = await this.tasksService.updateTask(
      user,
      taskId,
      updateTask,
      true,
    );

    return task as ITask;
  }

  async deleteTask(payload: {
    user: IUser;
    projectId: string;
    stageId: string;
    taskId: string;
  }): Promise<ITask> {
    // FETCHING PROJECT
    const project = await this.Project.findById(payload.projectId).lean();

    if (!project) throw new BadRequestException('Project Not Found');
    /*  
    { _id: lounge, 'rooms._id': room },
      {
        $pull: { guests: userId },
        $set: { 'rooms.$': updatedRoom },
      },
       */
    const _stage = project?.stages?.find(
      (el) => String((el as any)._id) == payload.stageId,
    );
    if (!_stage) throw new BadRequestException('Stage not found');

    const isTaskInProjectStage = !!_stage.tasks.find(
      (task) => String(task) == payload.taskId,
    );

    if (!isTaskInProjectStage)
      throw new BadRequestException('Task not found in project stage');

    // DELETING TASK
    const _deletedTask = await this.tasksService.deleteTask(
      payload.user,
      payload.taskId,
    );

    // REMOVING TASK FRROM THE STAGE
    _stage.tasks = _stage.tasks.filter(
      (task) => String(task) !== String(payload.taskId),
    );

    // const _project =
    await this.Project.findOneAndUpdate(
      { _id: project._id, 'stages._id': (_stage as any)._id },
      { $set: { 'stages.$.tasks': _stage.tasks } },
      { new: true },
    )
      .populate([
        { path: 'stages.tasks' },
        { path: 'stages.user', select: 'firstName lastName photo' },
      ])
      .lean();

    return _deletedTask as ITask;
  }

  async switchTask(user: IUser, payload: SwitchTaskDto): Promise<IProject> {
    // FETCHING PROJECT
    const project = await this.Project.findById(payload.projectId).lean();

    if (!project) throw new BadRequestException('Project Not Found');

    const _stageFrom = project?.stages?.find(
      (el) =>
        String((el as any)._id) ==
        String(new Types.ObjectId(payload.stageFrom)),
    );

    if (!_stageFrom)
      throw new BadRequestException('Project stage of current task not found');

    const _stageTo = project?.stages?.find(
      (el) =>
        String((el as any)._id) == String(new Types.ObjectId(payload.stageTo)),
    );

    if (!_stageTo)
      throw new BadRequestException(
        'Project stage where to shift the task not found',
      );

    // CHECKING IF TASK IS IN THE FROM STAGE
    const isTaskInProjectStage = !!_stageFrom.tasks.find(
      (task) => String(task) == String(new Types.ObjectId(payload.taskId)),
    );

    if (!isTaskInProjectStage)
      throw new BadRequestException('Task not found in project stage');

    const [err, __task] = await this.tasksService.getSingleTask(payload.taskId);

    if (err) throw err;

    // SHIFTING from 'FROM' TO 'TO' stage
    _stageFrom.tasks = _stageFrom.tasks.filter((task) => {
      return String(task) != String(new Types.ObjectId(payload.taskId));
    });

    _stageTo.tasks.push(payload.taskId);

    const [, _project] = await Promise.all([
      this.Project.findOneAndUpdate(
        { _id: project._id, 'stages._id': (_stageFrom as any)._id },
        { $set: { 'stages.$.tasks': _stageFrom.tasks } },
      ),
      this.Project.findOneAndUpdate(
        { _id: project._id, 'stages._id': (_stageTo as any)._id },
        { $set: { 'stages.$.tasks': _stageTo.tasks } },
        { new: true },
      )
        .populate([
          { path: 'stages.tasks' },
          { path: 'stages.user', select: 'firstName lastName photo' },
        ])
        .lean(),
    ]);

    if (__task?.assignedTo.length > 0) {
      const notif = __task?.assignedTo?.map((ele) => {
        return this.notificationService.createNotification({
          senderMode: user?.role[0],
          sender: user._id,
          receiver: ele?._id,
          title: `Business Brokerage Services`,
          message: `Your Task has been moved from "${_stageFrom?.name}" to "${_stageTo?.name}" stage`,
          fcmToken: ele?.fcmToken,
          socket: ele?.socketIds,
          flag: 'project-task',
          receiverUser: {
            pushNotifications: ele?.pushNotifications,
            inAppNotifications: ele?.inAppNotifications,
          },
        });
      });

      await Promise.all(notif);
    }

    return _project as IProject;
  }

  async applyTemplateToProject(payload: {
    user: IUser;
    applyTask: applyTaskDto;
  }): Promise<IProject> {
    // FETCHING PROJECT
    const project = await this.Project.findById(
      payload.applyTask.projectId,
    ).lean();

    if (!project) throw new BadRequestException('Project Not Found');

    const _stage = project?.stages?.find((el) => {
      return (
        String((el as any)._id) ==
        String(new Types.ObjectId(payload.applyTask.stage))
      );
    });

    if (!_stage) throw new BadRequestException('Project Stage not found');

    // GET A TEMPLATE
    const _tasks = await this.taskTemplatesService.getSingleTemplate(
      payload?.applyTask?.templateId,
    );

    const calcTasks = _tasks.tasks.map((tsk) => {
      tsk.creator = payload.user._id;
      (tsk as any).project = project._id;
      tsk.active = 'active';
      tsk.type = 'task';

      if (tsk.noOfDays > 0) {
        tsk.deadlineDate = moment().add(tsk.noOfDays, 'days').toDate() as any;
      }
      tsk._id = undefined;

      return tsk;
    });

    const taskIds = await this.tasksService.insertManyTasks(
      payload.user,
      payload.applyTask.projectId,
      calcTasks as unknown as Task[],
    );

    _stage.tasks.push(...taskIds?.ids);

    // const taskEventPromises = taskIds.tasks.map((tsk) =>
    //   this.tasksService.registerTaskToEvent(payload.user, tsk as any),
    // );

    const _project = await this.Project.findOneAndUpdate(
      { _id: project._id, 'stages._id': (_stage as any)._id },
      { $set: { 'stages.$.tasks': _stage.tasks } },
      { new: true },
    )
      .populate([
        { path: 'stages.tasks' },
        { path: 'stages.user', select: 'firstName lastName photo' },
      ])
      .lean();

    // await Promise.all(taskEventPromises);

    return _project as IProject;
  }
}
