/* eslint-disable prettier/prettier */
import { Document } from 'mongoose';

export interface INewsLetter extends Document {
  firstName: string;
  lastName: string;
  businessName: string;
  contact: string;
  email: string;
  message: string;
  recommendFrom: string;
  status: 'pending' | 'seen' | 'rejected';
}
