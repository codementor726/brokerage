import * as crypto from 'crypto';
import { Schema } from 'mongoose';
import { default as validator } from 'validator';
import { hash, compare } from 'bcryptjs';

const NdaSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    contact: { type: String },
    email: { type: String },
    streetAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: Number, default: null },
    licensedBroker: { type: Boolean },
    brokerName: { type: String },
    brokerCompanyName: { type: String },
    preferredLocation: { type: [String] },
    capitalAvailable: { type: [String] },
    currentOccupation: { type: String },
    businessInterested: { type: String },
    timeAllocatedForBusiness: { type: String },
    minAnnualIncomeNeeds: { type: String },
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

const ImapSchema = new Schema(
  {
    user: { type: String, default: null },
    password: { type: String, default: null },
    host: { type: String, default: 'mail.bizbrokerscolorado.com' },
    port: { type: Number, default: 993 },
    authTimeout: { type: Number, default: 10000 },
    tls: { type: Boolean, default: true },
    tlsOptions: { type: Object, default: { rejectUnauthorized: false } },
  },
  { timestamps: true },
);

const UserRingCentralSchema = new Schema(
  {
    clientId: { type: String, default: null },
    clientSecret: { type: String, default: null },
    username: { type: String, default: null },
    password: { type: String, default: null },
    extension: { type: String, default: null },
  },
  { timestamps: true },
);

const UserSchema = new Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'] },
    lastName: { type: String, required: [true, 'Last name is required'] },
    photo: { type: String, default: 'default.png' },
    email: {
      type: String,
      unique: true,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    contact: { type: String, default: '' },
    officeContact: { type: String, default: '' },
    deskContact: { type: String, default: '' },
    cell: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
    designation: { type: String, default: '' },
    description: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: Number, default: null },
    imap: { type: ImapSchema, default: {} },
    mobilePhone: { type: String, default: '' },
    HomePhone: { type: String, default: '' },
    workPhone: { type: String, default: '' },

    // PROFILE PROPS -------------------------------ENDS

    // USER MANAGING PROPS -------------------------------STARTS
    involvedBusiness: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
      default: [],
      index: true,
    },
    ownedBusiness: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
      default: [],
      index: true,
    },
    role: {
      type: [String],
      enum: [
        'buyer',
        'seller',
        'banker',
        'attorney',
        'accountant',
        'job-seeker',
        'landlord',
        'property-manager',
        'job-applicant',
        'title-company',
        '3rd-party-contacts',
        'insurance-agent',
        'service-provider',
        // these above are web-based user
        'admin',
        'financial-analyst', //admin rights excluding CMS
        'buyer-concierge', //admin rights excluding CMS
        'seller-concierge', //admin rights excluding CMS
        'executive', //admin rights including CMS
        // brokers
        'broker',
        'third-party-broker',
        'co-broker',
        // for chat
        'guest-user',
      ],
      default: ['buyer', 'seller'],
    },
    vipList: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
      default: [],
      index: true,
    },
    ndaSigned: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
      default: [],
      index: true,
    },
    leadInterested: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
      default: [],
      index: true,
    },
    ndaSubmitted: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
      default: [],
      index: true,
    },
    nda: NdaSchema,
    notes: { type: [NoteSchema], default: [] },
    fcmToken: { type: [String], default: [] },
    isOnline: { type: Boolean, default: false },
    socketIds: { type: [String], default: [] },
    active: {
      type: String,
      enum: {
        values: ['active', 'user-deactivated', 'system-deactivated'],
        message: `{VALUE} is not supported.`,
      },
      default: 'active',
      select: false,
    },
    lastLogin: { type: Date, default: Date.now() },
    isCampaignAllowed: { type: Boolean, default: true },
    ringCentral: { type: UserRingCentralSchema, default: {} },
    // USER MANAGING PROPS -------------------------------ENDS

    // STRIPE PROPS -------------------------------STARTS
    cus: {
      type: String,
      // required: [true, 'Stripe customer id is required.'],
    },
    pushNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true },
    // STRIPE PROPS -------------------------------ENDS

    // CORE FIELDS -------------------------------STARTS
    password: {
      type: String,
      // required: [true, 'Please provide a password'],
      minlength: [8, 'Password is too short.'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    passwordChangedAt: Number,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // CORE FIELDS -------------------------------ENDS
  },
  {
    timestamps: true,
  },
);

// Virtual populate
UserSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'User',
  localField: '_id',
});

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });
// userSchema.index({ location: '2dsphere' });

UserSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// UserSchema.virtual('displayName').get(function () {
//   return `${this.firstName || ''} ${this.lastName || ''}`;
// });

UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      new Date(this.passwordChangedAt).getTime() / 1000 + '',
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export { UserSchema };

// { email: {$nin : ["michaelbyarssc@gmail.com", "admin@admin.com", "michael@denverbbs.com"] } }
