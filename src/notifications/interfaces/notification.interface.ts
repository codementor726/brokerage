/* eslint-disable prettier/prettier */
import { Document } from 'mongoose';

type payload = {
  room: string;
};
export interface INotification extends Document {
  sender: string;
  senderMode: string;
  seen?: boolean;
  payload?: payload;
  flag?: 'none' | 'lead' | 'chat' | 'project-task';
  receiver: string;
  message: string;
  title: string;
  link?: string;
}
