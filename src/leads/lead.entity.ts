import { Schema } from 'mongoose';
import { default as validator } from 'validator';

const NdaSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required.'],
    },
    contact: {
      type: String,
      required: [true, 'Contact no. is required.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    streetAddress: {
      type: String,
      required: [true, 'Street Address is required.'],
    },
    city: {
      type: String,
      required: [true, 'City is required.'],
    },
    state: {
      type: String,
      required: [true, 'State is required.'],
    },
    zipCode: {
      type: Number,
      required: [true, 'Zip Code is required.'],
    },
    licensedBroker: {
      type: Boolean,
      required: [true, 'Working with a licensed broker is required.'],
    },
    brokerName: {
      type: String,
    },
    brokerCompanyName: {
      type: String,
    },
    preferredLocation: {
      type: [String],
    },
    capitalAvailable: {
      type: [String],
    },
    currentOccupation: {
      type: String,
    },
    businessInterested: {
      type: String,
    },
    timeAllocatedForBusiness: {
      type: String,
      enum: ['none', 'full-time', 'part-time', 'absentee'],
      default: 'none',
    },
    minAnnualIncomeNeeds: {
      type: String,
      required: [true, 'Minimum annual income needs is required'],
    },
    // dateSigned: {
    //   type: Date,
    //   required: [true, 'Signing date is required'],
    // },
    areYouSure: {
      type: Boolean,
      required: [true, 'Are you sure about this NDA is required'],
    },
    areYouAcknowledged: {
      type: Boolean,
      required: [true, 'Acknowledgement about this NDA is required'],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    refferedBusiness: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Reffered Business is Required.'],
    },
  },
  { timestamps: true },
);

const NoteSchema = new Schema(
  {
    message: {
      type: String,
      required: [true, 'Icon is required'],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notes creator is required'],
    },
  },
  { timestamps: true },
);

const LeadSchema = new Schema(
  {
    broker: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: [true, 'Broker is Required.'],
    },
    contactName: {
      type: String,
      required: [true, 'Name is required'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact is required'],
    },
    // business id here
    listingID: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Listing ID is required'],
    },
    leavedUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    refID: {
      type: String,
      default: '',
    },
    contactZip: {
      type: String,
      default: '',
    },
    ableToInvest: {
      type: String,
      default: 'Not disclosed',
    },
    purchaseWithin: {
      type: String,
      default: 'Not disclosed',
    },
    comments: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'inquired',
        'nda-submitted',
        'nda-signed',
        'nda-approved',
        'under-negotiation',
        'under-contract',
        'sold',
        'not-interested',
        'not-qualified',
        'closed',
      ],
      default: 'inquired',
    },
    leadProgress: {
      type: String,
      enum: [
        'called',
        'emailed',
        'ref-to-broker',
        'not-interested',
        'not-qualified',
      ],
      default: 'called',
    },
    template: {
      type: String,
      default: '',
    },
    ndaTemplate: {
      type: String,
      default: '',
    },
    outsideLead: {
      type: Boolean,
      default: false,
      index: true,
    },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    nda: NdaSchema,
    memorandum: {
      type: String,
      default: '',
    },
    notes: { type: [NoteSchema] },
  },
  { timestamps: true },
);

export { LeadSchema };
