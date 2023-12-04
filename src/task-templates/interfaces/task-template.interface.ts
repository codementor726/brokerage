import { Document } from 'mongoose';
import { ITask } from 'src/tasks/interfaces/task.interface';

export interface ITaskTemplate extends Document {
  name: string;
  slug: string;
  tasks: ITask[];
}
