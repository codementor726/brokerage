import { Document } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { IRoom } from 'src/chats/interfaces/room.interface';
import { IUser } from 'src/users/interfaces/user.interface';

type notes = {
  message: string;
  creator: IUser;
};
export interface INda extends Document {
  firstName: string;
  lastName: string;
  contact: string;
  email: string;
  refferedBusiness: IBusiness;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: number;
  licensedBroker: boolean;
  brokerName: string;
  brokerCompanyName: string;
  preferredLocation: string[];
  capitalAvailable: string[];
  currentOccupation: string;
  businessInterested: string;
  timeAllocatedForBusiness: string;
  minAnnualIncomeNeeds: string;
  // dateSigned: Date;
  areYouSure: boolean;
}
export interface ILead extends Document {
  broker: IUser[];
  leavedUsers: IUser[];
  buyer: IUser;
  contactName: string;
  contactPhone: string;
  contactZip: string;
  ableToInvest: string;
  purchaseWithin: string;
  comments: string;
  headline: string;
  outsideLead: boolean;
  listingID: IBusiness;
  refID: string;
  status:
    | 'inquired'
    | 'nda-submitted'
    | 'nda-signed'
    | 'nda-approved'
    | 'under-negotiation'
    | 'under-contract'
    | 'sold'
    | 'not-interested'
    | 'not-qualified'
    | 'closed';
  leadProgress:
    | 'called'
    | 'emailed'
    | 'ref-to-broker'
    | 'not-interested'
    | 'not-qualified';
  template: string;
  ndaTemplate: string;
  nda: INda;
  room: IRoom;
  memorandum: string;
  notes: notes[];
}
