import { Document } from 'mongoose';

export interface ICoreValues extends Document {
  title: string;
  description: string;
  order: number;
}
