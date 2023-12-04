import { Schema } from 'mongoose';

const stageSchema = new Schema(
  {
    name: { type: String, required: [true, 'Project Card name is required'] },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required'],
    },
    tasks: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
      default: [],
      // required: [true, 'Task Id is required'],
    },
    // inActiveTasks: {
    //   type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    //   default: [],
    //   // required: [true, 'Task Id is required'],
    // },
  },
  { timestamps: true },
);

const ProjectSchema = new Schema(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      unique: true,
      required: [true, 'Business name is required'],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event creator is required'],
    },
    name: { type: String, required: [true, 'Project Name is required'] },
    slug: { type: String, index: true, unique: true },
    isActive: { type: Boolean, default: true },
    assignTo: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      // required: [true, 'Event attendees are required'],
    },
    stages: {
      type: [stageSchema],
      default: [],
      // required: [true, 'Event decription is required'],
    },
  },
  { timestamps: true },
);

ProjectSchema.index({ slug: 1 });

ProjectSchema.pre(/^find/, function (next) {
  // const _this = this as any;

  this.populate([
    { path: 'creator', select: 'firstName lastName photo role' },
    { path: 'assignTo', select: 'firstName lastName photo role' },
    { path: 'business' },
    // select: 'firstName lastName photo',
  ]);

  next();
});

export { ProjectSchema };
