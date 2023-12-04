import { Document } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { ILead } from 'src/leads/interfaces/lead.interface';
import { IUser } from 'src/users/interfaces/user.interface';

type messages = {
  text: string;
  user: object;
};

type users = {
  userId: IUser;
  unreadCount: number;
};

export interface IRoom extends Document {
  title: string;
  users: users[];
  leavedUsers: IUser[];
  lastMessage: messages;
  reference: 'one-to-one' | 'lead-group' | 'business-group' | 'guest';
  status: 'active' | 'end';
  lastChatted: Date;
  lead: ILead;
  business: IBusiness;
}

export { users };
