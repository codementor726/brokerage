import mongoose from 'mongoose';
import validator from 'validator';

const infoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    address: {
      type: String,
      required: [true, 'Address is required.'],
    },
    contact: {
      type: String,
      required: [true, 'Contact is required.'],
    },
    url: {
      type: String,
      required: [true, 'Utl is required.'],
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required.'],
    },
  },
  { timestamps: true },
);

const AppConfigSchema = new mongoose.Schema({
  KeyType: {
    type: String,
    unique: true,
    enum: { values: ['ContactInfo'], message: 'enum mismatch!' },
    default: 'ContactInfo',
  },
  ContactInfo: infoSchema,
});

export { AppConfigSchema };
