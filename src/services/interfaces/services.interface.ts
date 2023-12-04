import { Document } from 'mongoose';

export interface IService extends Document {
  title: string;
  image: string;
  type: 'home' | 'services';
  order: number;
}
