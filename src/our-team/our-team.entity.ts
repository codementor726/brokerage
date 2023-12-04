import { Schema } from 'mongoose';

const OurTeamSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    officeContact: {
      type: String,
      required: [true, 'Office contact is required'],
    },
    deskContact: {
      type: String,
      required: [true, 'Desk contact is required'],
    },
    contact: { type: String, default: '' },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    order: { type: Number, default: 0 },
    photo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export { OurTeamSchema };
