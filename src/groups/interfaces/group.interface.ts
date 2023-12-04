import { Document } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import { IBusiness } from 'src/business/interfaces/business.interface';

export interface IGroup extends Document {
  name: string;
  type: string;
  users: IUser[];
  listings: IBusiness[];
}
