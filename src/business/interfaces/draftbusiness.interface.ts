import { Document } from 'mongoose';
import { ICategory } from 'src/categories/interfaces/category.interface';
import { IFolder } from 'src/data-room/interfaces/folder.interface';
import { IUser } from 'src/users/interfaces/user.interface';

type location = {
  type: 'Point';
  coordinates: [number, number];
};

type csv = {
  column1: string;
  column2: string;
  column3: string;
  column4: string;
  column5: string;
  column6: string;
};

type thirdPartyLinks = {
  key: string;
  link: string;
};

type operationHours = {
  days: string;
  hours: string;
};

type recentImprovements = {
  year: number;
  features: string[];
};

type propertyOptions = {
  title: string;
  description: string;
};

export interface IDraftBusiness extends Document {
  order: number;
  isFeatured: boolean;
  title: string;
  broker: IUser[];
  owner: IUser;
  projectFolder: IFolder;
  refId: string;
  status: 'active' | 'pre-listing' | 'under-contract' | 'sold' | 'off-market';
  dummyImage: string;
  images: string[];
  // askingPrice: number;
  inventory: number;
  cashFlow: number;
  grossSales: number;
  businessOpportunity: number;
  category: ICategory;
  industry: number;
  city: string;
  country: string;
  state: string;
  dummyDescription: string;
  description: string;
  buildingSF: string;
  // forSale: boolean;
  monthlyRent: number;
  realEstate: number;
  totalEmployees: number;
  partTimeEmployees: number;
  fullTimeEmployees: number;
  ownerInvolvment: string;
  reason: string;
  businessAddress: String;
  googleMapAddress: String;
  location: location;
  financialsCSV1: csv[];
  financialsCSV2: csv[];
  financialsDescription: string;
  financialsAnalysis: string[];
  financialsCSVImages: string[];
  businessHighlights: string[];
  thirdPartyPresence: thirdPartyLinks[];
  ndaSigned: string[];
  leadInterested: string[];
  ndaSubmitted: string[];
  vipUsers: string[];
  pros: string[];
  cons: string[];
  propertyInformation: propertyOptions;
  demographics: string[];
  hoursOfOperation: operationHours[];
  hoursOfOperationOpportunity: string;
  recentImprovements: recentImprovements[];
  financingOptions: string[];
  buyerAssignedToDataRoom: string[];
  companyName: string;
  autoNdaApprove: boolean;
}
