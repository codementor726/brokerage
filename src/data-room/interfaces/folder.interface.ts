import { Document } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { IUser } from 'src/users/interfaces/user.interface';

type roles =
  | 'buyer'
  | 'broker'
  | 'seller'
  | 'banker'
  | 'attorney'
  | 'third-party-broker'
  | 'accountant'
  | 'financial-analyst'
  | 'buyer-concierge'
  | 'seller-concierge'
  | 'executive'
  | 'admin';

export interface IFolder extends Document {
  name: string;
  fileName: string;
  isFile: boolean;
  business: IBusiness;
  parent: string;
  leavedUsers: IUser[];
  owner: string;
  allowedBuyers: string[];
  allowedSellers: string[];
  children: string[];
  // roles:
  //   | 'buyer'
  //   | 'broker'
  //   | 'seller'
  //   | 'banker'
  //   | 'attorney'
  //   | 'accountant'
  //   | 'financial-analyst'
  //   | 'buyer-concierge'
  //   | 'seller-concierge'
  //   | 'executive'
  //   | 'admin';
  roles: roles[];
  isActive: boolean;
  isDeletable: boolean;
  order: number;
  type: 'broker' | 'data-room' | 'company';
}
