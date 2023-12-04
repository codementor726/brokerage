import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import { pagination } from 'src/utils/utils.types';
import { CreateEventDto } from './dto/create-event.dto';
import { ICalendar } from './interfaces/calendar.interface';
import { matchRoles } from 'src/utils/utils.helper';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel('Calendar')
    private readonly Calendar: Model<ICalendar>,
  ) {}

  async getAllDayEventsAccToCalendar(params: {
    user: IUser;
    type?: string | any;
    date?: string;
    agenda?: string;
    offset?: number;
  }): Promise<{ results: number; events: ICalendar[] }> {
    const { user, agenda, date, offset } = params;
    let { type } = params;

    const initialDate = !!date
      ? moment.utc(date).add(offset, 'minute')
      : moment.utc().add(offset, 'minute');

    const startDate = initialDate.startOf('day').toDate();
    const endDate = initialDate.endOf('day').toDate();

    console.log({ startDate, endDate });

    if (!!type) type = [type];
    else type = ['event', 'task'];

    let queryObject: any = {
      type: { $in: type },
      date: { $gte: startDate, $lte: endDate },
    };

    if (!!agenda)
      queryObject = { ...queryObject, agenda: new RegExp(agenda, 'i') };

    const adminRoles = [
      'admin',
      'financial-analyst',
      'buyer-concierge',
      'seller-concierge',
      'executive',
    ];

    const checkRole = matchRoles(user.role, adminRoles);

    if (!checkRole)
      queryObject = {
        ...queryObject,
        $or: [
          { creator: user._id },
          { attendees: { $in: [user._id] } },
          { customerAttendees: { $in: [user._id] } },
        ],
      };

    const events = await this.Calendar.find(queryObject)
      .populate('creator', 'firstName lastName photo')
      .populate('attendees', 'firstName lastName photo')
      .populate('customerAttendees', 'firstName lastName photo')
      .lean();

    return { results: events.length, events: events as ICalendar[] };
  }

  async getAllEventsAccToCalendar(
    user: IUser,
    date: string,
    type?: string | any,
    agenda?: string,
  ): Promise<{ results: number; events: ICalendar[] }> {
    const startDate = moment(date).startOf('month').format();
    const endDate = moment(date).endOf('month').format();

    if (!!type) type = [type];
    else type = ['event', 'task'];

    let queryObject: any = { type: { $in: type } };

    if (!!agenda)
      queryObject = { ...queryObject, agenda: new RegExp(agenda, 'i') };

    const events = await this.Calendar.find({
      ...queryObject,
      $or: [
        { creator: user._id },
        { attendees: { $in: [user._id] } },
        { customerAttendees: { $in: [user._id] } },
      ],
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('creator', 'firstName lastName photo')
      .populate('attendees', 'firstName lastName photo')
      .populate('customerAttendees', 'firstName lastName photo')
      .lean();

    return { results: events.length, events: events as ICalendar[] };
  }

  async getAllEvents(query: pagination): Promise<ICalendar[]> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const events = await this.Calendar.find()
      .populate('creator', 'firstName lastName photo')
      .populate('attendees', 'firstName lastName photo')
      .populate('customerAttendees', 'firstName lastName photo')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return events as ICalendar[];
  }

  // create Calendar (ADMIN AND BROKER BOTH)
  async createEvent(
    createEventDto: CreateEventDto,
    user: IUser,
  ): Promise<ICalendar> {
    const { date, type } = createEventDto;

    if (moment() > moment(date))
      throw new BadRequestException(
        'Request can not be processed because of invalid date.',
      );

    if (![type].includes('event'))
      throw new BadRequestException(`Invalide type: ${type}`);

    let event = await this.Calendar.create({
      ...createEventDto,
      creator: user._id,
    });

    event = await this.Calendar.findById(event._id)
      .populate('attendees')
      .populate('customerAttendees')
      .lean();

    return event as ICalendar;
  }

  async addTaskToEvent(
    payload: {
      creator: string;
      attendees: IUser[];
      type: string;
      task: string;
      name: string;
      color: string;
      agenda: string;
      description: string;
      date: Date;
    },
    user: IUser,
  ): Promise<[Error, ICalendar]> {
    const { date, type } = payload;
    payload.color = '#FF5733';

    if (moment() > moment(date))
      return [
        new BadRequestException(
          'Request can not be processed because of invalid date.',
        ),
        null,
      ];

    if (payload.type !== 'task')
      return [new BadRequestException(`Invalide type: ${type}`), null];

    const event = await this.Calendar.create({
      ...payload,
      creator: user._id,
    });

    return [null, event as ICalendar];
  }

  async updateTaskToEvent(
    payload: {
      creator: string;
      attendees: IUser[];
      type: string;
      task: string;
      name: string;
      color: string;
      agenda: string;
      description: string;
      date: Date;
    },
    user: IUser,
  ): Promise<[Error, ICalendar]> {
    const { date, type } = payload;
    payload.color = '#FF5733';

    if (moment() > moment(date))
      return [
        new BadRequestException(
          'Request can not be processed because of invalid date.',
        ),
        null,
      ];

    if (payload.type !== 'task')
      return [new BadRequestException(`Invalide type: ${type}`), null];

    let event = await this.Calendar.findOneAndUpdate(
      { task: payload.task },
      {
        ...payload,
        creator: user._id,
      },
      { new: true },
    ).lean();

    if (!event) {
      const [errr, res] = await this.addTaskToEvent(payload, user);

      if (errr)
        return [new BadRequestException(`Invalide type: ${type}`), null];
      return [null, res as ICalendar];
    }

    return [null, event as ICalendar];
  }

  async deleteEvent(eventId: string, user: IUser): Promise<ICalendar> {
    const _event = await this.Calendar.findOne({
      _id: eventId,
      creator: user._id,
    });

    if (!_event) throw new NotFoundException('Event not found');

    const event = await this.Calendar.findByIdAndDelete(eventId);

    return event as ICalendar;
  }

  async deleteTask(taskId: string, user: IUser): Promise<ICalendar> {
    const _event = await this.Calendar.findOne({
      taskId: taskId,
      creator: user._id,
    });

    if (!_event) throw new NotFoundException('Task not found');

    const event = await this.Calendar.findByIdAndDelete(_event._id);

    return event as ICalendar;
  }

  async deleteMultipleTasks(taskIds: string[]): Promise<void> {
    await this.Calendar.deleteMany({ task: { $in: taskIds } });
  }

  // FOR ADMIN
  async eventsCalendarForAdmin(
    user: IUser,
    date: string,
    type?: string | any,
    agenda?: string,
    involvedTasks?: string,
  ): Promise<{ results: number; events: ICalendar[] }> {
    const startDate = moment(date).startOf('month').format();
    const endDate = moment(date).endOf('month').format();

    if (!!type) type = [type];
    else type = ['event', 'task'];

    let queryObject: any = { type: { $in: type } };

    if (!!agenda)
      queryObject = { ...queryObject, agenda: new RegExp(agenda, 'i') };

    if (involvedTasks == 'true')
      queryObject = {
        ...queryObject,
        $or: [{ creator: user._id }, { attendees: { $in: [user._id] } }],
      };

    const events = await this.Calendar.find({
      ...queryObject,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('creator', 'firstName lastName photo')
      .populate('attendees', 'firstName lastName photo')
      .populate('customerAttendees', 'firstName lastName photo')
      .lean();

    return { results: events.length, events: events as ICalendar[] };
  }
}
