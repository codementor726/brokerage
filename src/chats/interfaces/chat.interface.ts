import { Document } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';

type messages = {
  text: string;
  user: object;
};

type to = {
  userId: IUser;
  isReadMessage: boolean;
  isDeliveredMessage: boolean;
};
export interface IChat extends Document {
  room: string;
  from: string;
  to: to[];
  message: messages;
}

export { messages, to };
