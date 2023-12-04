import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { ITaskTemplate } from './interfaces/task-template.interface';
import slugify from 'slugify';
import { ITask } from 'src/tasks/interfaces/task.interface';

@Injectable()
export class TaskTemplatesService {
  constructor(
    @InjectModel('TaskTemplate')
    private readonly TaskTemplate: Model<ITaskTemplate>,
    @InjectModel('Task')
    private readonly Task: Model<ITask>,
  ) {}

  async getAllTaskTemplate(
    query: pagination,
    search?: string,
  ): Promise<{
    results: number;
    totalCount: number;
    templates: ITaskTemplate[];
  }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    let data = [];

    const q = {
      name: new RegExp(search, 'i'),
    };
    if (query.page == undefined && query.limit == undefined) {
      data = await this.TaskTemplate.find(q)
        .populate({
          path: 'tasks',
          populate: {
            path: 'assignedTo',
          },
        })
        .sort('-createdAt')
        .lean();
    } else {
      data = await this.TaskTemplate.find(q)
        .populate({
          path: 'tasks',
          populate: {
            path: 'assignedTo',
          },
        })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const count = await this.TaskTemplate.countDocuments();

    return {
      results: data.length as number,
      totalCount: count as number,
      templates: data as ITaskTemplate[],
    };
  }

  async getSingleTemplate(slug: string): Promise<ITaskTemplate> {
    const template = await this.TaskTemplate.findOne({ slug })
      .populate('tasks')
      .lean();

    return template as ITaskTemplate;
  }

  async createTemplateTask(
    name: string,
    tasks?: string[],
  ): Promise<ITaskTemplate> {
    const slug = slugify(name, { lower: true, strict: false });

    const data = await this.TaskTemplate.create({
      name,
      slug,
      tasks: tasks,
    });

    return data as ITaskTemplate;
  }

  async updateTemplateTask(slug: string, name: string): Promise<ITaskTemplate> {
    const _slug = slugify(name, { lower: true, strict: false });

    const template = await this.TaskTemplate.findOneAndUpdate(
      { slug },
      { name, slug: _slug },
      { new: true },
    )
      .populate('tasks')
      .lean();

    return template as ITaskTemplate;
  }

  // async addTaskToTemplateTask(
  //   slug: string,
  //   tasks: string[],
  // ): Promise<ITaskTemplate> {
  //   const template = await this.TaskTemplate.findOneAndUpdate(
  //     { slug },
  //     { $push: { tasks: { $each: tasks } } },
  //     { new: true },
  //   )
  //     .populate('tasks')
  //     .lean();

  //   return template as ITaskTemplate;
  // }

  // async removeTaskFromTemplateTask(
  //   slug: string,
  //   tasks: string[],
  // ): Promise<ITaskTemplate> {
  //   const template = await this.TaskTemplate.findOneAndUpdate(
  //     { slug },
  //     { $pull: { tasks: { $in: tasks } } },
  //     { new: true },
  //   )
  //     .populate('tasks')
  //     .lean();

  //   return template as ITaskTemplate;
  // }

  async deleteTemplate(templateId: string): Promise<ITaskTemplate> {
    const template = await this.TaskTemplate.findByIdAndDelete(
      templateId,
    ).lean();

    if (template.tasks.length > 0)
      await this.Task.deleteMany({ _id: { $in: template.tasks } });

    return template as ITaskTemplate;
  }
}
