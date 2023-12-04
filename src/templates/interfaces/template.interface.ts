import { Document } from 'mongoose';

export interface ITemplate extends Document {
  subject: string;
  message: string;
  attachment: string[];
  isActive: boolean;
}
