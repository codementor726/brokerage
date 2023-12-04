import { Document } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { ILead } from 'src/leads/interfaces/lead.interface';

type NDA = {
  firstName: string;
  lastName: string;
  contact: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  mobilePhone: string;
  HomePhone: string;
  workPhone: string;
  zipCode: number;
  licensedBroker: boolean;
  brokerName: string;
  brokerCompanyName: string;
  preferredLocation: string[];
  capitalAvailable: string[];
  currentOccupation: string[];
  businessInterested: string[];
  timeAllocatedForBusiness: string;
  minAnnualIncomeNeeds: string;
};

type Imap = {
  user: string;
  password: string;
  host: string;
  port: number;
  authTimeout: number;
  tls: boolean;
  tlsOptions: object;
};

// type UserRingCentral = {
//   clientId: string;
//   clientSecret: string;
//   username: string;
//   password: string;
//   extension: string;
// };

type notes = {
  message: string;
  creator: IUser;
};

export interface IUser extends Document {
  cus: string;
  inAppNotifications: boolean;
  pushNotifications: boolean;

  firstName: string;
  lastName: string;
  photo: string;
  email: string;
  contact: string;
  officeContact: string;
  deskContact: string;
  cell: string;
  meetingLink: string;
  designation: string;
  description: string;
  city: string;
  zipCode: number;
  involvedBusiness: IBusiness[];
  ownedBusiness: IBusiness[];
  interestedListing: ILead[];
  role: string[];
  vipList: string[];
  ndaSigned: string[];
  leadInterested: string[];
  ndaSubmitted: string[];
  nda: NDA;
  fcmToken: string[];
  isOnline: boolean;
  socketIds: [string];
  active: string;
  lastLogin: string;
  isCampaignAllowed: boolean;
  imap: Imap;
  // ringCentral: UserRingCentral;
  notes: notes[];

  password: string;
  passwordConfirm: string;
  passwordResetToken: string;
  passwordResetExpires: string;

  correctPassword: (candidatePassword: string, userPassword: string) => boolean;
  changedPasswordAfter: (candidatePassword: number) => boolean;
  createPasswordResetToken: () => string;
}

export { Imap };
