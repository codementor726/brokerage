import { Schema } from 'mongoose';

const csvSchema = new Schema(
  {
    column1: { type: String, default: null },
    column2: { type: String, default: null },
    column3: { type: String, default: null },
    column4: { type: String, default: null },
    column5: { type: String, default: null },
    column6: { type: String, default: null },
  },
  { timestamps: true },
);

const thirdPartySchema = new Schema(
  {
    key: { type: String, required: [true, 'Key is required'] },
    link: { type: String, required: [true, 'Link is required'] },
  },
  { timestamps: true },
);

const operationHoursSchema = new Schema(
  {
    days: { type: String, defult: '' },
    hours: { type: String, defult: '' },
  },
  { timestamps: true },
);

const recentImprovementsSchema = new Schema(
  {
    year: { type: Number, required: [true, 'Day(s) is/are required'] },
    features: { type: [String], required: [true, 'Hours are required'] },
  },
  { timestamps: true },
);

const propertyInformationSchema = new Schema(
  {
    title: { type: String, default: '' },
    leaseInformation: { type: String, default: '' },
    leaseRate: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { timestamps: true },
);

const NoteSchema = new Schema(
  {
    message: { type: String, required: [true, 'Icon is required'] },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notes creator is required'],
    },
  },
  { timestamps: true },
);

const BusinessSchema = new Schema(
  {
    /**
     * IMAGES FIELD STARTS HERE
     */
    dummyImage: { type: String, default: '' },
    images: { type: [String], default: [] },
    financialsAnalysis: { type: [String], default: [] },
    leavedUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    demographics: { type: [String], default: [] },
    financialsCSVImages: { type: [String], default: [] },
    /**
     * DATA ROOM MAIL FOLDER ID
     */
    projectFolder: { type: Schema.Types.ObjectId, ref: 'Folder' },
    /**
     * IMAGES FIELD ENDS HERE AND STATISTICS FIELDS STARTS HERE
     */
    inventory: { type: Number, default: 0 },
    cashFlow: { type: Number, default: 0 },
    grossSales: { type: Number, default: 0 },
    industry: { type: String, default: '' },
    businessOpportunity: { type: Number, default: 0 },
    totalEmployees: { type: Number, default: 0 },
    amountType: { type: String, enum: ['rent', 'real-estate'] },
    /**
     * STATISTICS FIELDS ENDS HERE
     */
    order: { type: Number, index: true },
    isFeatured: { type: Boolean, default: false },
    // visible w/o NDA
    title: {
      type: String,
      unique: true,
      required: [true, 'Title is required'],
    },
    refId: { type: String, unique: true, index: true },
    slug: { type: String, index: true, unique: true },
    // visible after NDA
    broker: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: [true, 'Broker is required.'],
    },
    // visible to admin only
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    futureOwner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    // visible w/o NDA
    status: {
      type: String,
      enum: ['active', 'pre-listing', 'under-contract', 'sold', 'off-market'],
      default: 'active',
    },
    // visible w/o NDA
    // askingPrice: {
    //   type: Number,
    //   default: 0,
    // },
    // visible w/o NDA
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required.'],
    },
    // visible w/o NDA
    city: { type: String, default: '' },
    // visible w/o NDA
    country: { type: String, default: '' },
    // visible w/o NDA
    state: { type: String, default: '' },
    // visible w/o NDA
    dummyDescription: { type: String, default: '' },
    // visible after NDA
    description: { type: String, default: '' },
    // visible w/o NDA
    buildingSF: { type: String, default: '' },
    // visible w/o NDA
    monthlyRent: { type: Number, default: 0 },
    realEstate: { type: Number, default: 0 },
    // visible after NDA
    partTimeEmployees: { type: Number, default: 0 },
    // visible w/o NDA
    fullTimeEmployees: { type: Number, default: 0 },
    // visible w/o NDA
    ownerInvolvment: { type: String, default: '' },
    // visible w/o NDA
    reason: { type: String, default: '' },
    // visible after NDA
    businessAddress: { type: String, default: '' },
    // visible after NDA
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // coordinates: [lng,lat]
      coordinates: [Number],
    },
    googleMapAddress: { type: String, default: '' },
    // visible after NDA
    financialsCSV1: { type: [csvSchema], default: null },
    financialsCSV2: { type: [csvSchema], default: null },
    // visible after NDA
    financialsDescription: { type: String, default: '' },
    // visible w/o NDA
    businessHighlights: { type: [String], default: [] },
    // visible after NDA
    thirdPartyPresence: {
      type: [thirdPartySchema],
      default: [
        { key: 'google', link: 'google.com' },
        { key: 'facebook', link: 'facebook.com' },
      ],
    },
    // visible after NDA
    pros: { type: [String], default: [] },
    // visible after NDA
    cons: { type: [String], default: [] },
    // visible after NDA
    propertyInformation: { type: propertyInformationSchema, default: {} },
    // visible w/o NDA
    hoursOfOperation: { type: [operationHoursSchema], default: [] },
    // visible after NDA
    hoursOfOperationOpportunity: { type: String, default: '' },
    // visible w/o NDA
    recentImprovements: { type: [recentImprovementsSchema], default: [] },
    // visible after NDA
    financingOptions: { type: [String], default: [] },
    // visible to admin only
    companyName: { type: String, default: '', select: false },
    ndaSigned: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
    leadInterested: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
    ndaSubmitted: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
    vipUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
    buyerAssignedToDataRoom: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
    autoNdaApprove: { type: Boolean, default: false },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    notes: { type: [NoteSchema] },
    ownerTemplate: { type: String, default: null },
  },

  { timestamps: true },
);
BusinessSchema.index({ slug: 1 });

export { BusinessSchema };
