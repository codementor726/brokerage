import { Schema } from 'mongoose';
import { default as validator } from 'validator';

const ValuationSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    spouseName: {
      type: String,
    },
    streetAddress: {
      type: String,
      required: [true, 'Street address is required'],
    },
    streetAddress2: {
      type: String,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
    },
    contact: {
      type: String,
      required: [true, 'Contact No is required'],
    },
    currentBusiness: {
      type: String,
      required: [true, 'Current Occupation/Business is required'],
    },
    planningToRelocate: {
      type: Boolean,
      required: [true, 'Planning to relocate choice is required'],
    },
    ownedBusiness: {
      type: String,
      required: [true, 'Have you ever owned business before is required'],
    },
    lookingForBusiness: {
      type: String,
      required: [
        true,
        'How long have you been looking for business is required',
      ],
    },
    planPurchasingBusiness: {
      type: String,
      required: [true, 'Where do you plan to purchase a business is required'],
    },
    businessAssistance: {
      type: String,
      required: [true, 'Who will assist you in business operation is required'],
    },
    planPayingPurchase: {
      type: String,
      required: [true, 'how do you plan to purchase a business is required'],
    },
    cashRange: {
      type: String,
      required: [true, 'What is your cash payment range is required'],
    },
    creditScore: {
      type: String,
      required: [true, 'What is your credit score is required'],
    },
    bankruptcy: {
      type: Boolean,
      required: [true, 'Have you ever filed for bankruptcy is required'],
    },
    felony: {
      type: Boolean,
      required: [true, 'Have you ever involved in felany is required'],
    },
    currentClaims: {
      type: Boolean,
      required: [true, 'Do you have any current legal claims is required'],
    },
    totalCash: {
      type: String,
      required: [true, 'Total cash in bank is required'],
    },
    accountsPayable: {
      type: String,
      required: [true, 'Accounts payable is required'],
    },
    totalStock: {
      type: String,
      required: [true, 'Total stock value is required'],
    },
    payables: {
      type: String,
      required: [true, 'Notes payables to bank is required'],
    },
    retirementFunds: {
      type: String,
      required: [true, 'Total requirement funds is required'],
    },
    mortgage: {
      type: String,
      required: [true, 'Mortgage on homestead is required'],
    },
    homeEquity: {
      type: String,
      required: [true, 'Total home equity is required'],
    },
    otherMortgages: {
      type: String,
      required: [true, 'Other mortgages is required'],
    },
    totalEquity: {
      type: String,
      required: [true, 'Total real state equity is required'],
    },
    otherLiabilities: {
      type: String,
      required: [true, 'Other liabilities is required'],
    },
    businessEquity: {
      type: String,
      reuqired: [true, 'Total business interest and equity is required'],
    },
    totalLiabilities: {
      type: String,
      required: [true, 'Total Liabilities is required'],
    },
    otherAssets: {
      type: String,
      required: [true, 'Other Assets are required'],
    },
    netWorth: {
      type: String,
      required: [true, 'Total net worth is required'],
    },
    totalAssets: {
      type: String,
      required: [true, 'Total Assets are required'],
    },
    liabilitesNetWorth: {
      type: String,
      required: [true, 'Total liabilities and networth is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'evaluated', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export { ValuationSchema };
