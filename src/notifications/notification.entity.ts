import { Schema, Types } from 'mongoose';

// const validator = require('validator');

const payloadSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
});

const NotificationSchema = new Schema(
  {
    // Notification creator
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // required: [true, 'Notification creator id is required.'],
    },
    senderMode: {
      type: String,
      enum: [
        'buyer',
        'broker',
        'seller',
        'banker',
        'attorney',
        'accountant',
        'financial-analyst',
        'buyer-concierge',
        'seller-concierge',
        'executive',
        'admin',
        'guest-user',
      ],
      required: [true, 'sender mode is required.'],
    },
    seen: {
      type: Boolean,
      default: false,
    },
    payload: payloadSchema,
    flag: {
      type: String,
      enum: ['none', 'lead', 'chat', 'project-task'],
      default: 'none',
    },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Ids of the receivers of the notification
    // receiver: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Ids of the receivers of the notification
    message: { type: String, required: [true, 'message is required.'] }, // any description of the notification message
    title: { type: String, required: [true, 'title is required.'] }, // any title description of the notification message
    link: String,
  },
  { timestamps: true },
);

export { NotificationSchema };
