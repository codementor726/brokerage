import { Schema, Types, model } from 'mongoose';

const messageSchema = new Schema(
  {
    text: { type: String, required: true },
    user: { type: Object }, // type: Object,
  },
  { timestamps: true },
);

const RoomSchema = new Schema(
  {
    title: {
      type: String,
      default: '',
    },
    users: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User Id is required'],
          },
          unreadCount: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    leavedUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
    },
    lastMessage: { type: messageSchema, default: null },
    reference: {
      type: String,
      enum: {
        values: ['lead-group', 'business-group', 'guest', 'one-to-one'],
        message: `{VALUE} is not supported.`,
      },
      default: 'lead-group',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'end'],
        message: `{VALUE} is not supported.`,
      },
      default: 'active',
    },
    lastChatted: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true },
);

export { RoomSchema };
