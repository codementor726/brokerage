import { Document } from 'mongoose';

export interface IValuation extends Document {
  email: string;
  firstName: string;
  lastName: string;
  spouseName: string;
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  postalCode: string;
  contact: string;
  currentBusiness: string;
  planningToRelocate: boolean;
  ownedBusiness: string;
  lookingForBusiness: string;
  planPurchasingBusiness: string;
  businessAssistance: string;
  planPayingPurchase: string;
  cashRange: string;
  creditScore: string;
  bankruptcy: boolean;
  felony: boolean;
  currentClaims: boolean;
  totalCash: string;
  accountsPayable: string;
  totalStock: string;
  payables: string;
  retirementFunds: string;
  mortgage: string;
  homeEquity: string;
  otherMortgages: string;
  totalEquity: string;
  otherLiabilities: string;
  businessEquity: string;
  totalLiabilities: string;
  otherAssets: string;
  netWorth: string;
  totalAssets: string;
  liabilitesNetWorth: string;
  status: 'pending' | 'evaluated' | 'rejected';
}