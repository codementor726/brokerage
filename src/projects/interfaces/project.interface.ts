import { Document } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { IUser } from 'src/users/interfaces/user.interface';

type Stage = {
  name: string;
  user: string;
  tasks: string[];
};

export interface IProject extends Document {
  business: IBusiness;
  creator: IUser;
  name: string;
  slug: string;
  assignTo: string[];
  stages: Stage[];
}

export { Stage };
