import { Schema } from 'mongoose';

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'Name of the group is required'],
    },
    users: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: [true, 'Users of the group are required'],
      index: true,
    },
    listings: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
    },
    type: {
      type: String,
      required: [true, 'Group type is required'],
      enum: ['user', 'broker', 'listing'],
      default: 'broker',
    },
    status: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export { GroupSchema };
