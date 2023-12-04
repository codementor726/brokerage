import { Schema } from 'mongoose';

const FolderSchema = new Schema(
  {
    name: {
      type: String,
      index: true,
      required: [true, 'Folder Name is required'],
    },
    fileName: { type: String },
    isFile: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['data-room', 'broker', 'company'],
      default: 'data-room',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'folder owner is required'],
    },
    leavedUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    // business id here
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      // required: [true, 'Listing ID is required'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
    },
    allowedBuyers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      index: true,
      default: [],
    },
    allowedSellers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      index: true,
      default: [],
    },
    children: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],
      default: [],
    },
    roles: {
      type: [String],
      enum: [
        'buyer',
        'broker',
        'seller',
        'banker',
        'attorney',
        'third-party-broker',
        'accountant',
        'financial-analyst',
        'buyer-concierge',
        'seller-concierge',
        'executive',
        'admin',
      ],
      default: ['admin'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeletable: {
      type: Boolean,
      default: true,
      select: false,
    },
    order: {
      type: Number,
      default: 2,
    },
  },
  { timestamps: true },
);

export { FolderSchema };

// db.folders.deleteMany({ name: {$nin : ["Company Data Room", "Broker Data Room"] } })
