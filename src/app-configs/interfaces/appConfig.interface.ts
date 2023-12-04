import { Document } from 'mongoose';

type contactInfo = {
  email: string;
  address: string;
  contact: string;
  url: string;
  name: string;
  designation: string;
};
export interface IAppConfig extends Document {
  KeyType: 'ContactInfo';
  ContactInfo: contactInfo;
}

export { contactInfo };
