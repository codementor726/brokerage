import { Document } from 'mongoose';

export interface IFaqs extends Document {
  question: string;
  answer: string;
  type: 'buyer' | 'seller';
  order: number;
  isActive: boolean;
}
