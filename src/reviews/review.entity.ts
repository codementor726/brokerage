import { Schema } from 'mongoose';

const ReviewSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    userName: {
      type: String,
      required: [true, 'Username is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
    },
  },
  { timestamps: true },
);

export { ReviewSchema };
