import { Schema } from 'mongoose';

const TestimonialSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is Required.'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    rating: {
      type: Number,
      required: [true, 'rating is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export { TestimonialSchema };
