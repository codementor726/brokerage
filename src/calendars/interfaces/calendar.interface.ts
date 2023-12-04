import { Document } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';

export interface ICalendar extends Document {
  creator: IUser;
  attendees: IUser[];
  customerAttendees: IUser[];
  task: string;
  type: 'event' | 'task';
  name: string;
  color: string;
  venue: string;
  agenda: string;
  description: string;
  date: Date;
  // endDate: Date;
  // type: string;
}
