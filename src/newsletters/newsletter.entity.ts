import { Schema } from 'mongoose';
import { default as validator } from 'validator';

const NewslettersSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First Name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last Name is required'],
    },
    businessName: {
      type: String,
      default: null,
    },
    contact: {
      type: String,
      required: [true, 'Contact is required'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    recommendFrom: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'seen', 'rejected'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['contact-us', 'free-business-evaluation'],
      default: 'contact-us',
    },
  },
  { timestamps: true },
);

export { NewslettersSchema };
