import { Schema, Types } from 'mongoose';

const TemplateSchema = new Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    message: {
      type: String,
      trim: true,
      required: [true, 'Message is required'],
    },
    attachment: {
      type: [String],
      required: [true, 'Attachment is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export { TemplateSchema };
