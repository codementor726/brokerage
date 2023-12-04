import { Schema, Types } from 'mongoose';

const CoreValuesSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
    },
  },
  { timestamps: true },
);

export { CoreValuesSchema };
