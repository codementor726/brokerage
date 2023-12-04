import { Schema } from 'mongoose';

const ServiceSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    type: {
      type: String,
      enum: ['home', 'services'],
      default: 'services',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export { ServiceSchema };
