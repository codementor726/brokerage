import { Schema } from 'mongoose';

const TaskTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    tasks: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
      // required: [true, 'Assigned To are required'],
      default: [],
    },
  },
  { timestamps: true },
);
TaskTemplateSchema.index({ slug: 1 });

export { TaskTemplateSchema };
