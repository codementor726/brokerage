import { Schema, Types } from 'mongoose';

const faqsSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    type: {
      type: String,
      enum: ['buyer', 'seller'],
      required: [true, 'Type is required'],
    },
    order: {
      type: Number,
      min: 0,
      required: [true, 'Order is required'],
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export { faqsSchema };
