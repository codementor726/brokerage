import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarService } from 'src/calendars/calendar.service';
import { ITaskTemplate } from 'src/task-templates/interfaces/task-template.interface';
import { IUser } from 'src/users/interfaces/user.interface';
import { includes } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTemplateTaskDto } from './dto/create-template.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ITask, Task } from './interfaces/task.interface';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel('Task')
    private readonly Task: Model<ITask>,
    @InjectModel('TaskTemplate')
    private readonly TaskTemplate: Model<ITaskTemplate>,
    private readonly calendarService: CalendarService,
  ) {}

  async getAllTasks(
    user: IUser,
    query: pagination,
    type?: string | any,
  ): Promise<{ results: number; tasks: ITask[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    if (!!type) type = [type];
    else type = ['template', 'task'];

    let queryObject: any = { type: { $in: type } };

    const tasks = await this.Task.find({
      assignedTo: { $in: [user._id] },
      ...queryObject,
    })
      .populate('project')
      .populate('creator', 'firstName lastName photo')
      .populate('assignedTo', 'firstName lastName photo')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return { results: tasks.length as number, tasks: tasks as ITask[] };
  }

  async getSingleTask(taskId: string): Promise<[Error, ITask]> {
    const task = await this.Task.findById(taskId)
      .populate(
        'assignedTo',
        'firstName lastName role fcmToken socketIds pushNotifications inAppNotifications',
      )
      .lean();

    if (!task) return [new BadRequestException('Task not found.'), null];

    return [null, task as ITask];
  }

  async createTask(user: IUser, createTaskDto: CreateTaskDto): Promise<ITask> {
    const task = await this.Task.create({
      ...createTaskDto,
      creator: user._id,
    });

    if (createTaskDto.deadlineDate) {
      const payload = {
        creator: String(user._id),
        attendees: task.assignedTo,
        type: 'task',
        task: String(task._id),
        name: task.title,
        color: '#FF5733',
        agenda: 'task',
        description: task?.description,
        date: task?.deadlineDate,
      };

      await this.calendarService.addTaskToEvent(payload, user);
    }

    return task as ITask;
  }

  async registerTaskToEvent(
    user: IUser,
    task: CreateTaskDto & {
      _id: Types.ObjectId;
    },
  ): Promise<any> {
    if (task.deadlineDate) {
      const payload = {
        creator: String(user._id),
        attendees: task.assignedTo,
        type: 'task',
        task: String(task._id),
        name: task.title,
        color: '#FF5733',
        agenda: 'task',
        description: task?.description,
        date: task?.deadlineDate,
      };

      return await this.calendarService.addTaskToEvent(payload as any, user);
    }
  }

  async insertManyTasks(
    user: IUser,
    project: string,
    tasks: Task[],
  ): Promise<{ ids: string[]; tasks: ITask[] }> {
    const task = await this.Task.insertMany(tasks);
    const ids = task.map((task) => task._id);

    return { ids: ids as string[], tasks: task as unknown as ITask[] };
  }

  async updateTask(
    user: IUser,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    isFromAdmin: boolean = false,
  ): Promise<ITask> {
    let query = {
      _id: taskId,
      creator: user._id,
    };

    if (isFromAdmin) delete query.creator;

    const _task = await this.Task.findOne(query).lean();

    if (!_task) throw new BadRequestException('Task not found');

    const task = await this.Task.findByIdAndUpdate(taskId, updateTaskDto, {
      new: true,
    })
      .populate('creator', 'firstName lastName email photo role')
      .populate('assignedTo', 'firstName lastName email photo role')
      .lean();

    const payload = {
      creator: String(user._id),
      attendees: task.assignedTo as IUser[],
      type: 'task',
      task: String(task._id),
      name: task.title,
      color: '#FF5733',
      agenda: 'task',
      description: task?.description,
      date: task?.deadlineDate,
    };

    if (!_task?.deadlineDate && !!updateTaskDto?.deadlineDate) {
      await this.calendarService.addTaskToEvent(payload, user);
    } else if (_task?.deadlineDate && updateTaskDto?.deadlineDate) {
      await this.calendarService.updateTaskToEvent(payload, user);
    } else if (!!_task?.deadlineDate && !task?.deadlineDate) {
      await this.calendarService.deleteTask(task._id, user);
    }
    return task as ITask;
  }

  async updateTaskActiveStatus(user: IUser, taskId: string): Promise<ITask> {
    let q = {};
    const _task = await this.Task.findOne({
      _id: taskId,
      creator: user._id,
    }).lean();

    if (!_task) throw new BadRequestException('Task not found');

    if (_task.active == 'active') {
      q = { active: 'in-active' };

      await this.calendarService.deleteTask(taskId, user);
    } else {
      q = { active: 'active' };

      const payload = {
        creator: String(user._id),
        attendees: _task.assignedTo as IUser[],
        type: 'task',
        task: String(_task._id),
        name: _task.title,
        color: '#FF5733',
        agenda: 'task',
        description: _task?.description,
        date: _task?.deadlineDate,
      };
      await this.calendarService.addTaskToEvent(payload, user);
    }

    const task = await this.Task.findByIdAndUpdate(taskId, q, { new: true });

    return task as ITask;
  }

  async deleteTask(user: IUser, taskId: string): Promise<ITask> {
    const _task = await this.Task.findOne({
      _id: taskId,
      creator: user._id,
    }).lean();

    if (!_task) throw new BadRequestException('Task not found');

    const task = await this.Task.findByIdAndDelete(taskId).lean();

    if (_task.deadlineDate) {
      await this.calendarService.deleteTask(taskId, user);
    }

    return task as ITask;
  }

  // delete all task of a project
  async deleteProjectTasks(projectId: string): Promise<void> {
    const taskIds = await this.Task.find({ project: projectId }).distinct(
      '_id',
    );
    await Promise.all([
      this.Task.deleteMany({
        _id: { $in: taskIds },
      }),
      this.calendarService.deleteMultipleTasks(taskIds),
    ]);
  }

  // delete multiple tasks by ids
  async deleteProjectStageTasksByIds(taskIds: string[]): Promise<void> {
    await Promise.all([
      this.Task.deleteMany({
        _id: { $in: taskIds },
      }),
      this.calendarService.deleteMultipleTasks(taskIds),
    ]);
  }

  async createComment(
    user: IUser,
    taskId: string,
    comment: string,
  ): Promise<ITask> {
    const _task = await this.Task.findById(taskId).lean();

    if (!_task) throw new BadRequestException('Task not found');

    if (
      !includes(user._id, _task.assignedTo) &&
      String(user._id) != String(_task.creator)
    )
      throw new BadRequestException(
        'You are neither creator nor the assignee of this task',
      );

    const _comment = {
      user: user._id,
      text: comment,
    };

    const task = await this.Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: _comment } },
      { new: true },
    );

    return task as ITask;
  }

  async updateComment(
    user: IUser,
    taskId: string,
    commentId: string,
    comment: string,
  ): Promise<ITask> {
    const _comment = await this.Task.findById(taskId).select('comments').lean();

    const isCommentThere = _comment.comments.find(
      (ele) => String(ele.user) == String(user._id),
    );

    if (!isCommentThere) throw new NotFoundException('Comment not found');

    const task = await this.Task.findOneAndUpdate(
      { _id: taskId, 'comments._id': commentId },
      { $set: { 'comments.$.text': comment } },
      { new: true },
    );

    return task as ITask;
  }

  async deleteComment(
    user: IUser,
    taskId: string,
    commentId: string,
  ): Promise<ITask> {
    const _comment = await this.Task.findById(taskId).select('comments').lean();

    const isCommentThere = _comment.comments.find(
      (ele) => String(ele.user) == String(user._id),
    );

    if (!isCommentThere) throw new NotFoundException('Comment not found');

    const comment = await this.Task.findByIdAndUpdate(
      taskId,
      { $pull: { comments: { _id: commentId } as any } },
      { new: true },
    );

    return comment as ITask;
  }

  async getAllTasksForAdmin(
    query: pagination,
  ): Promise<{ results: number; tasks: ITask[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const tasks = await this.Task.find()
      .populate({
        path: 'project',
        populate: {
          path: 'stages',
          populate: {
            path: 'user',
            select: 'firstName lastName email photo',
          },
        },
      })
      .populate('creator', 'firstName lastName photo')
      .populate('assignedTo', 'firstName lastName photo')
      .sort('-createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return { results: tasks.length as number, tasks: tasks as ITask[] };
  }

  ///////////////////////////////////////
  //  TEMPLATE SERVICES STARTED
  ///////////////////////////////////////
  async getAllTemplateTasksForAdmin(
    query: pagination,
  ): Promise<{ tasks: ITask[]; totalCount: number }> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const tasks = await this.Task.find({ type: 'template' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await this.Task.countDocuments({ type: 'template' });

    return { tasks: tasks as ITask[], totalCount };
  }

  async createTemplateTask(
    user: IUser,
    createTemplateTaskDto: CreateTemplateTaskDto,
  ): Promise<ITask> {
    const { type, slug } = createTemplateTaskDto;

    if (type != 'template')
      throw new BadRequestException(`Invalid type: ${type}`);

    const template = await this.TaskTemplate.findOne({ slug });

    if (!template)
      throw new NotFoundException('The template slug entered is invalid.');

    const task = await this.Task.create({
      ...createTemplateTaskDto,
      creator: user._id,
    });

    await this.TaskTemplate.findOneAndUpdate(
      { slug },
      { $push: { tasks: [task._id] as any } },
      { new: true },
    );

    return task as ITask;
  }

  async updateTemplateTask(
    user: IUser,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<ITask> {
    const _template = await this.Task.findById(taskId).lean();

    if (!_template) throw new BadRequestException('Template not found');

    const template = await this.Task.findByIdAndUpdate(taskId, updateTaskDto, {
      new: true,
    })
      .populate('project')
      .populate('creator', 'firstName lastName photo')
      .populate('assignedTo', 'firstName lastName photo')
      .lean();

    return template as ITask;
  }

  async deleteTemplateTask(
    user: IUser,
    templateId: string,
    taskId: string,
  ): Promise<ITask> {
    const _task = await this.Task.findById(taskId).lean();

    if (!_task) throw new NotFoundException('Task not Found.');

    const task = await this.Task.findByIdAndDelete(taskId);

    await this.TaskTemplate.findOneAndUpdate(
      { slug: templateId },
      { $pull: { tasks: task._id } },
      { new: true },
    );

    return task as ITask;
  }
}
