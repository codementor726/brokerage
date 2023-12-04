import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ILead } from 'src/leads/interfaces/lead.interface';
import { TemplatesService } from 'src/templates/templates.service';
import { IUser } from 'src/users/interfaces/user.interface';
import { pagination } from 'src/utils/utils.types';
import { IGroup } from './interfaces/group.interface';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel('Group')
    private readonly Group: Model<IGroup>,
    @InjectModel('Lead')
    private readonly Lead: Model<ILead>,
    private readonly templatesService: TemplatesService,
  ) {}

  async getAllGroups(
    query: pagination,
    search: string,
  ): Promise<{ results: number; data: IGroup[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const dbQuery = {
      ...(search && {
        name: { $regex: search, $options: 'i' },
      }),
    };

    const data = await this.Group.find(dbQuery)
      .populate(
        'users',
        'firstName lastName photo email contact officeContact deskContact cell designation description',
      )
      .populate('listings', 'title images')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return { results: data.length as number, data: data as IGroup[] };
  }

  async createGroup(
    name: string,
    users: string[],
    type: string,
    listings: string[],
    status: string[],
  ): Promise<IGroup> {
    if (!name || !type)
      throw new BadRequestException('Please provide all the required fields.');

    if (status.length > 0) {
      const leads = (await this.Lead.find({
        status: { $in: status },
        listingID: { $in: listings },
      })
        .distinct('buyer')
        .lean()) as unknown as string[];

      users = [...leads];
    }

    let data = await this.Group.create({ name, users, type, listings, status });

    data = await this.Group.findById(data._id)
      .populate(
        'users',
        'firstName lastName photo email contact officeContact deskContact cell designation description',
      )
      .populate('listings', 'title')
      .lean();

    return data as IGroup;
  }

  async updateGroup(
    groupId: string,
    name: string,
    users: string[],
    type: string,
    listings?: string[],
    status?: string[],
  ): Promise<IGroup> {
    const _data = await this.Group.findById(groupId).lean();
    if (!_data) throw new BadRequestException('Group not found');

    if (type == 'listing') {
      if (status.length > 0) {
        const leads = (await this.Lead.find({
          status: { $in: status },
          listingID: { $in: listings },
        })
          .distinct('buyer')
          .lean()) as unknown as string[];

        users = [...leads];
      }
    }

    const data = await this.Group.findByIdAndUpdate(
      groupId,
      { name, users, type, listings, status },
      { new: true },
    )
      .populate(
        'users',
        'firstName lastName photo email contact officeContact deskContact cell designation description',
      )
      .populate('listings', 'title')
      .lean();

    return data as IGroup;
  }

  async deleteGroup(groupId: string): Promise<IGroup> {
    const _data = await this.Group.findById(groupId).lean();
    if (!_data) throw new NotFoundException('Group not found');

    const data = await this.Group.findByIdAndDelete(groupId).lean();

    return data as IGroup;
  }

  async sendMessageToGroupUsers(
    templateId: string,
    groupId: string,
    cc: string[],
    user: IUser,
  ): Promise<void> {
    if (!templateId)
      throw new BadRequestException('Please provide template Id');

    const data = await this.Group.findById(groupId).populate('users').lean();
    if (!data) throw new NotFoundException('Group not found');

    await this.templatesService.sendTemplateMails(
      templateId,
      data.users as IUser[],
      user,
      cc,
    );
  }
}
