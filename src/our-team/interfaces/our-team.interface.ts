import { Document } from 'mongoose';

export interface IOurTeam extends Document {
  firstName: string;
  lastName: string;
  designation: string;
  email: string;
  officeContact: string;
  deskContact: string;
  contact: string;
  description: string;
  order: number;
  photo: string;
  isActive: boolean;
}
