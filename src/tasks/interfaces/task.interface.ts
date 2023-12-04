import { Document, Types } from 'mongoose';
import { IProject } from 'src/projects/interfaces/project.interface';
import { IUser } from 'src/users/interfaces/user.interface';

type comments = {
  user: IUser;
  text: string;
};

type Task = {
  creator: IUser;
  project: IProject;
  title: string;
  assignedTo: IUser[];
  description: string;
  comments: comments[];
  type: 'task' | 'template';
  active: 'active' | 'in-active';
};

export interface ITask extends Document {
  creator: IUser;
  project: IProject;
  title: string;
  noOfDays: number;
  assignedTo: IUser[];
  description: string;
  comments: comments[];
  type: 'task' | 'template';
  active: 'active' | 'in-active';
  // order: number;
  deadlineDate: Date;
}

export { Task };
