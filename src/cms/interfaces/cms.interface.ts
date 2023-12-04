import { Document } from 'mongoose';

type SellYourBusiness = {
  pageName: string;
  section1_title: string;
  section1_image: string;
  section1_description: string;
  section2_title: string;
  section2_image: string;
  section2_description: string;
  section3_title: string;
  section3_image: string;
  section3_description: string;
  section4_title: string;
  section4_image: string;
  section4_description: string;
};

type icons = {
  key: string;
  title: string;
};

type Services = {
  pageName: string;
  main_title: string;
  section1_title: string;
  section1_description: string;
  section1_image: string;
  section2_title: string;
  section2_description: string;
  section2_image: string;
  section3_title: string;
  section3_image: string;
  section3_description: string;
  section4_icons: icons[];
  section4_title: string;
  section4_description: string;
};

type footerIconsObj = {
  icon_type: string;
  link: string;
};

type Footer = {
  pageName: string;
  footer_title: string;
  footer_image: string;
  footer_description: string;
  footer_icons: [footerIconsObj];
  contactNo: string;
  email: string;
};

type About = {
  pageName: string;
  section1_title: string;
  section1_subTitle1: string;
  section1_subTitle2: string;
  section1_subTitle3: string;
  section1_image: string;
  section2_title: string;
  section2_description: string;
  section3_title: string;
  section3_description: string;
  section3_image: string;
  section4_description: string;
  section4_image: string;
  section5_description: string;
  section5_image: string;
};

type OperationHours = {
  days: string;
  hours: string;
};

type ContactUs = {
  pageName: string;
  title: string;
  description: string;
  callUs: string[];
  visitUs: string;
  haveQuestions: string;
  hoursOfOperation: OperationHours;
  footer_title1: string;
  footer_description1: string;
  footer_title2: string;
  footer_description2: string;
  getInTouchImage: string;
  getInTouchTitle: string;
};

type Home = {
  pageName: string;
  section1_image: string;
  section1_title: string;
  section1_subTitle: string;
  section1_description: string;
  section2_icon1: string;
  section2_title1: string;
  section2_description1: string;
  section2_icon2: string;
  section2_title2: string;
  section2_description2: string;
  section3_title: string;
  section3_description: string;
  section3_image: string;
  section4_icons: icons[];
  section5_title1: string;
  section5_description1: string;
  section5_title2: string;
  section5_description2: string;
};

type Listing = {
  pageName: string;
  section1_title: string;
  section1_subTitle: string;
  section1_description: string;
  section1_image: string;
};

type CareerOpportunities = {
  pageName: string;
  section1_title: string;
  section1_description: string;
  section2_title: string;
  section2_subTitle1: string;
  section2_description1: string;
  section2_subTitle2: string;
  section2_description2: string;
};
export interface ICms extends Document {
  home: Home;
  contact: ContactUs;
  about: About;
  services: Services;
  listing: Listing;
  sellYourBusiness: SellYourBusiness;
  careerOpportunities: CareerOpportunities;
  footer: Footer;
}

export {
  Home,
  ContactUs,
  About,
  Services,
  Listing,
  Footer,
  SellYourBusiness,
  CareerOpportunities,
};
