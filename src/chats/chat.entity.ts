import { Schema } from 'mongoose';

const messageSchema = new Schema(
  {
    text: { type: String, required: true },
    user: { type: Object },
  },
  {
    timestamps: true,
  },
);

const ChatSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    to: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
          index: true,
        },
        isReadMessage: {
          type: Boolean,
          required: false,
        },
        isDeliveredMessage: {
          type: Boolean,
          required: false,
        },
      },
    ],
    message: { type: messageSchema, default: null },
  },
  {
    timestamps: true,
  },
);

export { ChatSchema };
