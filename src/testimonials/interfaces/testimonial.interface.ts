/* eslint-disable prettier/prettier */
import { Document } from 'mongoose';

export interface ITestimonial extends Document {
  user: string;
  description: string;
  rating: number;
  isActive: string;
}
