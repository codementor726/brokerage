import { Schema } from 'mongoose';

const CalendarSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event creator is required'],
    },
    attendees: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      // required: [true, 'Event attendees are required'],
    },
    customerAttendees: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      // required: [true, 'Event attendees are required'],
    },
    type: {
      type: String,
      enum: {
        values: ['event', 'task'],
        message: 'enum mismatch!',
      },
      default: 'event',
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      // unique: true,
      // required: [true, 'Event creator is required'],
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
    },
    color: {
      type: String,
      required: [true, 'Color code is required'],
    },
    // where => venue
    venue: {
      type: String,
      default: '',
      // required: [true, 'Event venue is required'],
    },
    agenda: {
      type: String,
      required: [true, 'Agenda is required'],
    },
    description: {
      type: String,
      // required: [true, 'Event decription is required'],
    },
    date: {
      type: Date,
      index: true,
      required: [true, 'Event start date is required'],
    },

    // endDate: {
    //   type: Date,
    //   required: [true, 'Event end date is required'],
    // },
  },
  { timestamps: true },
);

export { CalendarSchema };
